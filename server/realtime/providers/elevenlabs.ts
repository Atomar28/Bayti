import fetch from "node-fetch";

export interface TTSConfig {
  apiKey: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

export interface TTSStream {
  cancel: () => void;
}

export async function* streamTTS(
  textChunks: AsyncIterable<string>,
  config: TTSConfig
): AsyncGenerator<Uint8Array, void, unknown> {
  const voiceId = config.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice
  const model = config.model || "eleven_turbo_v2_5";
  
  let cancelled = false;
  const controller = new AbortController();

  try {
    for await (const textChunk of textChunks) {
      if (cancelled) break;
      if (!textChunk.trim()) continue;

      console.log(`Synthesizing TTS for: "${textChunk}"`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "xi-api-key": config.apiKey,
          },
          body: JSON.stringify({
            text: textChunk,
            model_id: model,
            voice_settings: {
              stability: config.stability || 0.5,
              similarity_boost: config.similarityBoost || 0.8,
              style: config.style || 0.0,
              use_speaker_boost: config.speakerBoost || true,
            },
            output_format: "mp3_22050_32",
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body from ElevenLabs");
      }

      // Stream audio chunks
      const reader = response.body.getReader();
      try {
        while (true) {
          if (cancelled) break;
          
          const { done, value } = await reader.read();
          if (done) break;
          
          if (value) {
            yield new Uint8Array(value);
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  } catch (error) {
    if (!cancelled) {
      console.error("Error in streamTTS:", error);
      throw error;
    }
  }

  // Return cancel function
  return {
    cancel: () => {
      cancelled = true;
      controller.abort();
    }
  } as any;
}

// Simplified TTS for single text input
export async function* streamSingleTTS(
  text: string,
  config: TTSConfig
): AsyncGenerator<Uint8Array, void, unknown> {
  async function* singleTextGenerator() {
    yield text;
  }
  
  yield* streamTTS(singleTextGenerator(), config);
}

// Helper to create TTS config from environment
export function createTTSConfig(): TTSConfig {
  return {
    apiKey: process.env.ELEVENLABS_API_KEY!,
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Default ElevenLabs voice
    model: "eleven_turbo_v2_5",
    stability: 0.5,
    similarityBoost: 0.8,
    style: 0.0,
    speakerBoost: true,
  };
}