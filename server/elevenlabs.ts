// ElevenLabs API integration for voice management
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  samples: any[];
  category: string;
  fine_tuning: {
    is_allowed: boolean;
    model_id?: string;
    language?: string;
  };
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  sharing: {
    status: string;
    history_item_sample_id?: string;
    original_voice_id?: string;
    public_owner_id?: string;
    liked_by_count: number;
    cloned_by_count: number;
  };
  high_quality_base_model_ids: string[];
}

export interface ElevenLabsModel {
  model_id: string;
  name: string;
  can_be_finetuned: boolean;
  can_do_text_to_speech: boolean;
  can_do_voice_conversion: boolean;
  can_use_style: boolean;
  can_use_speaker_boost: boolean;
  serves_pro_voices: boolean;
  token_cost_factor: number;
  description: string;
  requires_alpha_access: boolean;
  max_characters_request_free_user: number;
  max_characters_request_subscribed_user: number;
  maximum_text_length_per_request: number;
  languages: Array<{
    language_id: string;
    name: string;
  }>;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("ElevenLabs API key not found. Voice features will be limited.");
    }
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.apiKey) {
      // Return default voices if no API key
      return this.getDefaultVoices();
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "xi-api-key": this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error("Error fetching voices from ElevenLabs:", error);
      return this.getDefaultVoices();
    }
  }

  async getModels(): Promise<ElevenLabsModel[]> {
    // Return the latest 2024 ElevenLabs models with pricing info
    return [
      {
        model_id: "eleven_flash_v2_5",
        name: "Flash v2.5 (Ultra Fast)",
        description: "Ultra-low latency (~75ms), 32 languages, 50% cheaper - Perfect for real-time calls",
        can_be_finetuned: false,
        can_do_text_to_speech: true,
        can_do_voice_conversion: false,
        can_use_style: true,
        can_use_speaker_boost: true,
        serves_pro_voices: true,
        token_cost_factor: 0.5,
        requires_alpha_access: false,
        max_characters_request_free_user: 2500,
        max_characters_request_subscribed_user: 40000,
        maximum_text_length_per_request: 40000,
        languages: [{ language_id: "en", name: "English" }, { language_id: "es", name: "Spanish" }]
      },
      {
        model_id: "eleven_turbo_v2_5", 
        name: "Turbo v2.5 (Balanced)",
        description: "Balanced quality and speed, multilingual, 50% cheaper - Great for most applications",
        can_be_finetuned: false,
        can_do_text_to_speech: true,
        can_do_voice_conversion: false,
        can_use_style: true,
        can_use_speaker_boost: true,
        serves_pro_voices: true,
        token_cost_factor: 0.5,
        requires_alpha_access: false,
        max_characters_request_free_user: 2500,
        max_characters_request_subscribed_user: 10000,
        maximum_text_length_per_request: 10000,
        languages: [{ language_id: "en", name: "English" }, { language_id: "es", name: "Spanish" }]
      },
      {
        model_id: "eleven_multilingual_v2",
        name: "Multilingual v2 (Premium)",
        description: "Highest quality, 29 languages, premium model - Best for professional content",
        can_be_finetuned: true,
        can_do_text_to_speech: true,
        can_do_voice_conversion: true,
        can_use_style: true,
        can_use_speaker_boost: true,
        serves_pro_voices: true,
        token_cost_factor: 1.0,
        requires_alpha_access: false,
        max_characters_request_free_user: 2500,
        max_characters_request_subscribed_user: 10000,
        maximum_text_length_per_request: 10000,
        languages: [{ language_id: "en", name: "English" }, { language_id: "es", name: "Spanish" }, { language_id: "fr", name: "French" }]
      },
      {
        model_id: "eleven_monolingual_v1",
        name: "English v1 (Classic)",
        description: "Classic English model, reliable quality - Good for English-only applications",
        can_be_finetuned: false,
        can_do_text_to_speech: true,
        can_do_voice_conversion: false,
        can_use_style: false,
        can_use_speaker_boost: true,
        serves_pro_voices: false,
        token_cost_factor: 1.0,
        requires_alpha_access: false,
        max_characters_request_free_user: 2500,
        max_characters_request_subscribed_user: 10000,
        maximum_text_length_per_request: 10000,
        languages: [{ language_id: "en", name: "English" }]
      }
    ];
  }

  async updateVoiceSettings(voiceId: string, settings: {stability: number, similarityBoost: number, style?: number, speakerBoost?: boolean}): Promise<void> {
    console.log(`Voice settings stored for voice ${voiceId}:`, settings);
    
    // ElevenLabs API doesn't allow updating pre-built voice settings directly
    // Voice settings are applied per-request in the TTS synthesis call
    // The settings are now stored in database and will be used during synthesis
  }

  async testVoice(text: string, voiceId: string, modelId: string, voiceSettings?: {stability: number, similarityBoost: number, style?: number, speakerBoost?: boolean}): Promise<string> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key required for voice testing");
    }

    const settings = voiceSettings || {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0,
      use_speaker_boost: false
    };

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost || settings.similarity_boost || 0.8,
            style: settings.style || 0,
            use_speaker_boost: settings.speakerBoost || settings.use_speaker_boost || false
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // Convert to base64 for frontend playback
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      return `data:audio/mpeg;base64,${audioBase64}`;
    } catch (error) {
      console.error("Error testing voice:", error);
      throw error;
    }
  }

  private getDefaultVoices(): ElevenLabsVoice[] {
    return [
      {
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        name: "Sarah (Professional Female)",
        category: "premade",
        description: "Professional female voice perfect for business calls",
        preview_url: "",
        samples: [],
        fine_tuning: { is_allowed: false },
        labels: { accent: "american", description: "professional", age: "middle_aged", gender: "female" },
        available_for_tiers: ["free", "starter", "creator", "pro", "scale"],
        settings: { stability: 0.5, similarity_boost: 0.8 },
        sharing: { status: "public", liked_by_count: 0, cloned_by_count: 0 },
        high_quality_base_model_ids: []
      },
      {
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel (Conversational)",
        category: "premade",
        description: "Natural conversational voice ideal for friendly interactions",
        preview_url: "",
        samples: [],
        fine_tuning: { is_allowed: false },
        labels: { accent: "american", description: "conversational", age: "young", gender: "female" },
        available_for_tiers: ["free", "starter", "creator", "pro", "scale"],
        settings: { stability: 0.7, similarity_boost: 0.9 },
        sharing: { status: "public", liked_by_count: 0, cloned_by_count: 0 },
        high_quality_base_model_ids: []
      },
      {
        voice_id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi (Strong)",
        category: "premade",
        description: "Strong confident voice for authoritative communication",
        preview_url: "",
        samples: [],
        fine_tuning: { is_allowed: false },
        labels: { accent: "american", description: "strong", age: "young", gender: "female" },
        available_for_tiers: ["free", "starter", "creator", "pro", "scale"],
        settings: { stability: 0.4, similarity_boost: 0.85 },
        sharing: { status: "public", liked_by_count: 0, cloned_by_count: 0 },
        high_quality_base_model_ids: []
      },
      {
        voice_id: "TxGEqnHWrfWFTfGW9XjX",
        name: "Josh (Male Professional)",
        category: "premade",
        description: "Professional male voice for business communications",
        preview_url: "",
        samples: [],
        fine_tuning: { is_allowed: false },
        labels: { accent: "american", description: "professional", age: "young", gender: "male" },
        available_for_tiers: ["free", "starter", "creator", "pro", "scale"],
        settings: { stability: 0.6, similarity_boost: 0.8 },
        sharing: { status: "public", liked_by_count: 0, cloned_by_count: 0 },
        high_quality_base_model_ids: []
      }
    ];
  }

  private getDefaultModels(): ElevenLabsModel[] {
    return [
      {
        model_id: "eleven_monolingual_v1",
        name: "Eleven Monolingual v1",
        can_be_finetuned: true,
        can_do_text_to_speech: true,
        can_do_voice_conversion: true,
        can_use_style: false,
        can_use_speaker_boost: true,
        serves_pro_voices: false,
        token_cost_factor: 1,
        description: "Use our standard English language model to generate speech in a variety of voices, styles and moods.",
        requires_alpha_access: false,
        max_characters_request_free_user: 500,
        max_characters_request_subscribed_user: 5000,
        maximum_text_length_per_request: 5000,
        languages: [{ language_id: "en", name: "English" }]
      },
      {
        model_id: "eleven_multilingual_v1",
        name: "Eleven Multilingual v1",
        can_be_finetuned: true,
        can_do_text_to_speech: true,
        can_do_voice_conversion: true,
        can_use_style: false,
        can_use_speaker_boost: true,
        serves_pro_voices: false,
        token_cost_factor: 1,
        description: "Generate lifelike speech in multiple languages and create content that resonates with a broader audience.",
        requires_alpha_access: false,
        max_characters_request_free_user: 500,
        max_characters_request_subscribed_user: 5000,
        maximum_text_length_per_request: 5000,
        languages: [
          { language_id: "en", name: "English" },
          { language_id: "es", name: "Spanish" },
          { language_id: "fr", name: "French" },
          { language_id: "de", name: "German" },
          { language_id: "it", name: "Italian" },
          { language_id: "pt", name: "Portuguese" },
          { language_id: "ar", name: "Arabic" }
        ]
      }
    ];
  }
}

export const elevenLabsService = new ElevenLabsService();