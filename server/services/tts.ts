// Text-to-Speech service using ElevenLabs
export interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

class TTSService {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
  }

  // Get streaming URL for text synthesis
  async getStreamingUrl(text: string, options: TTSOptions = {}): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not configured');
      return null;
    }

    try {
      const {
        voiceId = 'iP95p4xoKVk53GoZ742B', // British male voice
        stability = 0.4,
        similarityBoost = 0.7,
        style = 0.3,
        speakerBoost = true,
      } = options;

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: this.cleanText(text),
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: speakerBoost,
          },
          output_format: 'mp3_22050_32',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs TTS error:', response.status, errorText);
        return null;
      }

      // Get the audio data and convert to data URL
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      return `data:audio/mpeg;base64,${base64Audio}`;

    } catch (error) {
      console.error('TTS synthesis error:', error);
      return null;
    }
  }

  // Clean text for TTS synthesis
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove SSML/HTML tags
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .replace(/[^\w\s.,!?;:'-]/g, '') // Remove special characters
      .trim()
      .substring(0, 500); // Limit length for API
  }

  // Test if service is available
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ttsService = new TTSService();