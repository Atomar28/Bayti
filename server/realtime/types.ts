// WebSocket message types for realtime communication
export interface WSMessage {
  type: string;
  data?: any;
}

export interface AudioChunkMessage extends WSMessage {
  type: "audio:chunk";
  data: {
    audio: string; // base64 encoded audio data
    timestamp: number;
  };
}

export interface STTPartialMessage extends WSMessage {
  type: "stt:partial";
  data: {
    text: string;
    timestamp: number;
  };
}

export interface STTFinalMessage extends WSMessage {
  type: "stt:final";
  data: {
    text: string;
    timestamp: number;
  };
}

export interface TTSChunkMessage extends WSMessage {
  type: "tts:chunk";
  data: {
    audio: string; // base64 encoded audio data
    timestamp: number;
  };
}

export interface TTSStopMessage extends WSMessage {
  type: "tts:stop";
  data: {
    reason: string;
    timestamp: number;
  };
}

export interface EventMessage extends WSMessage {
  type: "event";
  data: {
    name: string;
    details?: any;
    timestamp: number;
  };
}

export interface ErrorMessage extends WSMessage {
  type: "error";
  data: {
    message: string;
    code?: string;
    timestamp: number;
  };
}

export interface BargeinMessage extends WSMessage {
  type: "audio:bargein";
  data: {
    timestamp: number;
  };
}

export interface PingMessage extends WSMessage {
  type: "ping";
  data: {
    timestamp: number;
  };
}

export interface PongMessage extends WSMessage {
  type: "pong";
  data: {
    timestamp: number;
  };
}

// Union type for all possible messages
export type RealtimeWSMessage = 
  | AudioChunkMessage
  | STTPartialMessage 
  | STTFinalMessage
  | TTSChunkMessage
  | TTSStopMessage
  | EventMessage
  | ErrorMessage
  | BargeinMessage
  | PingMessage
  | PongMessage;

// Session interface
export interface RealtimeSession {
  id: string;
  startedAt: Date;
  clientIP?: string;
  userAgent?: string;
}

// Metrics interface
export interface SessionMetrics {
  sessionId: string;
  tFirstPartial?: number;
  tLLMFirstToken?: number;
  tTTSFirstAudio?: number;
  interruptions: number;
  totalAudioDuration: number;
  conversationTurns: number;
}

// Audio processing configuration
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  encoding: 'pcm16' | 'opus';
  chunkSizeMs: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  encoding: 'pcm16',
  chunkSizeMs: 20
};