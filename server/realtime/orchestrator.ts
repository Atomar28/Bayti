import { EventEmitter } from "events";
import { startDeepgramStream, type DeepgramStream } from "./providers/deepgram.js";
import { streamLLM, splitTextForTTS, createRealtimeContext, type LLMContext } from "./providers/openai.js";
import { streamTTS, createTTSConfig, type TTSStream } from "./providers/elevenlabs.js";
import type { RealtimeSession, SessionMetrics, DEFAULT_AUDIO_CONFIG } from "./types.js";
import { renderSSML, estimateSignalsFromTurns, type ConversationSignals } from './humanizer.js';
import { 
  HUMANIZE_ENABLED, 
  FILLER_RATE, 
  BREAK_SHORT_MS, 
  BREAK_CLAUSE_MS, 
  PACE_JITTER_PCT, 
  PITCH_JITTER_PCT 
} from './humanizer.config.js';

export interface OrchestratorEvents {
  'stt:partial': [text: string, timestamp: number];
  'stt:final': [text: string, timestamp: number];
  'tts:chunk': [audioChunk: Uint8Array, timestamp: number];
  'tts:stop': [reason: string, timestamp: number];
  'event': [name: string, details?: any, timestamp?: number];
  'error': [message: string, code?: string, timestamp?: number];
}

export class RealtimeOrchestrator extends EventEmitter {
  private session: RealtimeSession;
  private metrics: SessionMetrics;
  private deepgramStream: DeepgramStream | null = null;
  private llmContext: LLMContext;
  private currentTTSController: AbortController | null = null;
  private isTTSActive = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private lastAudioTimestamp = 0;
  private accumulatedText = "";
  private recentTurns: Array<{ role: 'user' | 'agent'; text: string; ms: number }> = [];

  constructor(session: RealtimeSession) {
    super();
    this.session = session;
    this.metrics = {
      sessionId: session.id,
      interruptions: 0,
      totalAudioDuration: 0,
      conversationTurns: 0
    };
    this.llmContext = createRealtimeContext();
    
    this.setupDeepgram();
  }

  private setupDeepgram() {
    if (!process.env.DEEPGRAM_API_KEY) {
      this.emit('error', 'Deepgram API key not configured', 'MISSING_API_KEY');
      return;
    }

    try {
      this.deepgramStream = startDeepgramStream({
        apiKey: process.env.DEEPGRAM_API_KEY,
        sampleRate: 16000,
        channels: 1,
        encoding: "linear16",
        language: "en-US",
        model: "nova-2",
        smartFormat: true,
        interimResults: true
      });

      this.deepgramStream.onPartial((text, timestamp) => {
        if (!this.metrics.tFirstPartial) {
          this.metrics.tFirstPartial = timestamp - this.session.startedAt.getTime();
        }
        this.emit('stt:partial', text, timestamp);
      });

      this.deepgramStream.onFinal((text, timestamp) => {
        this.emit('stt:final', text, timestamp);
        this.handleFinalTranscript(text, timestamp);
      });

      this.deepgramStream.onError((error) => {
        console.error('Deepgram error:', error);
        this.emit('error', error.message, 'DEEPGRAM_ERROR');
      });

      this.emit('event', 'deepgram_connected');
    } catch (error) {
      console.error('Failed to setup Deepgram:', error);
      this.emit('error', 'Failed to initialize speech recognition', 'DEEPGRAM_INIT_ERROR');
    }
  }

  public async processAudioChunk(audioData: Buffer, timestamp: number) {
    try {
      // Handle barge-in detection
      if (this.isTTSActive) {
        this.handleBargein();
      }

      // Send audio to Deepgram
      if (this.deepgramStream) {
        console.log('🎙️  Orchestrator forwarding audio to Deepgram, size:', audioData.length);
        this.deepgramStream.sendAudio(audioData);
      } else {
        console.warn('⚠️  No Deepgram stream available in orchestrator');
      }

      // Update metrics
      this.lastAudioTimestamp = timestamp;
      this.metrics.totalAudioDuration += 20; // Assuming 20ms chunks

      // Reset silence timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
      }

      // Set new silence timer for end-of-utterance detection
      this.silenceTimer = setTimeout(() => {
        this.handleSilenceDetected();
      }, 300); // 300ms of silence

    } catch (error) {
      console.error('Error processing audio chunk:', error);
      this.emit('error', 'Failed to process audio', 'AUDIO_PROCESSING_ERROR');
    }
  }

  private handleBargein() {
    if (this.isTTSActive) {
      this.metrics.interruptions++;
      this.stopTTS('user_interruption');
      this.emit('event', 'barge_in_detected', { interruptions: this.metrics.interruptions });
    }
  }

  private handleSilenceDetected() {
    // Silence detected - this could trigger LLM processing if we have accumulated text
    this.emit('event', 'silence_detected');
  }

  private async handleFinalTranscript(text: string, timestamp: number) {
    if (!text.trim()) return;

    try {
      this.accumulatedText = text;
      this.metrics.conversationTurns++;

      // Add to recent turns for humanizer
      this.addToRecentTurns('user', text, Date.now() - timestamp);

      // Add to conversation history
      if (this.llmContext.conversationHistory) {
        this.llmContext.conversationHistory.push({
          role: "user",
          content: text,
          timestamp
        });
      }

      this.emit('event', 'processing_llm_response', { text });

      // Stream LLM response
      await this.generateAndStreamResponse(text, timestamp);

    } catch (error) {
      console.error('Error handling final transcript:', error);
      this.emit('error', 'Failed to process transcript', 'TRANSCRIPT_PROCESSING_ERROR');
    }
  }

  private async generateAndStreamResponse(userText: string, timestamp: number) {
    try {
      const responseChunks: string[] = [];
      let firstTokenTimestamp: number | null = null;

      // Stream response from LLM
      for await (const token of streamLLM(userText, this.llmContext)) {
        if (!firstTokenTimestamp) {
          firstTokenTimestamp = Date.now();
          this.metrics.tLLMFirstToken = firstTokenTimestamp - timestamp;
          this.emit('event', 'llm_first_token', { latency: this.metrics.tLLMFirstToken });
        }
        responseChunks.push(token);

        // Check for natural breakpoints to start TTS
        const accumulatedResponse = responseChunks.join('');
        const chunks = splitTextForTTS(accumulatedResponse);
        
        if (chunks.length > 0 && chunks[chunks.length - 1].length > 50) {
          // Start TTS for the completed chunk
          const textToSpeak = chunks[chunks.length - 1];
          await this.synthesizeAndStreamAudio(textToSpeak);
        }
      }

      // Handle any remaining text
      const finalResponse = responseChunks.join('');
      if (finalResponse.trim()) {
        const remainingChunks = splitTextForTTS(finalResponse);
        for (const chunk of remainingChunks) {
          if (chunk.trim()) {
            await this.synthesizeAndStreamAudio(chunk);
          }
        }

        // Add to conversation history and recent turns for humanizer
        const agentTimestamp = Date.now();
        if (this.llmContext.conversationHistory) {
          this.llmContext.conversationHistory.push({
            role: "assistant",
            content: finalResponse,
            timestamp: agentTimestamp
          });
        }
        this.addToRecentTurns('agent', finalResponse, 1000); // Estimated 1s duration
      }

    } catch (error) {
      console.error('Error generating LLM response:', error);
      this.emit('error', 'Failed to generate response', 'LLM_ERROR');
    }
  }

  private async synthesizeAndStreamAudio(text: string) {
    if (!text.trim()) return;

    try {
      this.currentTTSController = new AbortController();
      this.isTTSActive = true;

      // Apply humanizer layer BEFORE TTS
      let processedText = text;
      if (HUMANIZE_ENABLED) {
        const signals = estimateSignalsFromTurns(this.recentTurns);
        const persona = {
          warmth: 0.6,
          formality: 0.4,
          fillerRate: FILLER_RATE,
          paceJitterPct: PACE_JITTER_PCT,
          pitchJitterPct: PITCH_JITTER_PCT,
          breakMs: {
            short: BREAK_SHORT_MS,
            clause: BREAK_CLAUSE_MS
          }
        };
        
        processedText = renderSSML(text, signals, persona);
        console.debug('Humanized text:', processedText);
      }

      const ttsConfig = createTTSConfig();
      let firstAudioTimestamp: number | null = null;

      // Create async generator for processed text
      const singleTextGenerator = async function*() {
        yield processedText;
      };

      for await (const audioChunk of streamTTS(singleTextGenerator(), ttsConfig)) {
        // Check if cancelled
        if (this.currentTTSController?.signal.aborted) {
          break;
        }

        if (!firstAudioTimestamp) {
          firstAudioTimestamp = Date.now();
          this.metrics.tTTSFirstAudio = firstAudioTimestamp - this.session.startedAt.getTime();
          this.emit('event', 'tts_first_audio', { latency: this.metrics.tTTSFirstAudio });
        }

        this.emit('tts:chunk', audioChunk, Date.now());
      }

    } catch (error) {
      if (!this.currentTTSController?.signal.aborted) {
        console.error('Error in TTS synthesis:', error);
        this.emit('error', 'Failed to synthesize speech', 'TTS_ERROR');
      }
    } finally {
      this.isTTSActive = false;
      this.currentTTSController = null;
    }
  }

  private stopTTS(reason: string) {
    if (this.currentTTSController && this.isTTSActive) {
      this.currentTTSController.abort();
      this.isTTSActive = false;
      this.emit('tts:stop', reason, Date.now());
    }
  }

  public getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  public cleanup() {
    try {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
      }

      if (this.deepgramStream) {
        this.deepgramStream.close();
      }

      this.stopTTS('session_ended');

      this.emit('event', 'session_cleanup');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Helper method to manage recent conversation turns for humanizer
  private addToRecentTurns(role: 'user' | 'agent', text: string, durationMs: number) {
    this.recentTurns.push({
      role,
      text,
      ms: durationMs
    });

    // Keep only recent turns (last 6 turns or 30 seconds)
    const thirtySecondsAgo = Date.now() - 30000;
    this.recentTurns = this.recentTurns
      .slice(-6) // Keep last 6 turns maximum
      .filter(turn => {
        // For simplicity, we'll keep all turns since we don't track absolute timestamps
        return true;
      });
  }
}