import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import WebSocket from "ws";

export interface DeepgramStreamConfig {
  apiKey: string;
  sampleRate?: number;
  channels?: number;
  encoding?: string;
  language?: string;
  model?: string;
  smartFormat?: boolean;
  interimResults?: boolean;
}

export interface DeepgramStream {
  sendAudio: (audioBuffer: Buffer) => void;
  onPartial: (callback: (text: string, timestamp: number) => void) => void;
  onFinal: (callback: (text: string, timestamp: number) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  close: () => void;
}

export function startDeepgramStream(config: DeepgramStreamConfig): DeepgramStream {
  const deepgram = createClient(config.apiKey);
  
  const connection = deepgram.listen.live({
    model: config.model || "nova-2",
    language: config.language || "en-US",
    smart_format: config.smartFormat !== false,
    interim_results: config.interimResults !== false,
    sample_rate: config.sampleRate || 16000,
    channels: config.channels || 1,
    encoding: config.encoding || "linear16",
    endpointing: 300, // ms of silence to trigger final
    utterance_end_ms: 1000,
    vad_events: true
  });

  let partialCallback: ((text: string, timestamp: number) => void) | null = null;
  let finalCallback: ((text: string, timestamp: number) => void) | null = null;
  let errorCallback: ((error: Error) => void) | null = null;

  // Handle transcript events
  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    try {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (!transcript) return;

      const timestamp = Date.now();
      const isFinal = data.is_final;

      console.log(`🎯 Deepgram transcript (${isFinal ? 'FINAL' : 'partial'}):`, transcript);

      if (isFinal) {
        finalCallback?.(transcript, timestamp);
      } else {
        partialCallback?.(transcript, timestamp);
      }
    } catch (error) {
      console.error("❌ Error processing Deepgram transcript:", error);
      errorCallback?.(error as Error);
    }
  });

  // Handle connection events
  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Deepgram connection opened");
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("Deepgram connection closed");
  });

  connection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error("Deepgram connection error:", error);
    errorCallback?.(new Error(`Deepgram error: ${error}`));
  });

  connection.on(LiveTranscriptionEvents.Metadata, (data) => {
    console.log("Deepgram metadata:", data);
  });

  return {
    sendAudio: (audioBuffer: Buffer) => {
      try {
        if (connection.getReadyState() === 1) { // WebSocket.OPEN = 1
          console.log('📡 Sending audio to Deepgram, size:', audioBuffer.length);
          connection.send(audioBuffer);
        } else {
          console.warn('⚠️  Deepgram connection not ready, state:', connection.getReadyState());
        }
      } catch (error) {
        console.error("❌ Error sending audio to Deepgram:", error);
        errorCallback?.(error as Error);
      }
    },

    onPartial: (callback: (text: string, timestamp: number) => void) => {
      partialCallback = callback;
    },

    onFinal: (callback: (text: string, timestamp: number) => void) => {
      finalCallback = callback;
    },

    onError: (callback: (error: Error) => void) => {
      errorCallback = callback;
    },

    close: () => {
      try {
        connection.finish();
      } catch (error) {
        console.error("Error closing Deepgram connection:", error);
      }
    }
  };
}