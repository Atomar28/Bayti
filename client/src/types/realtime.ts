// Realtime WebSocket message types for client-server communication

export type RealtimeWSMessage = 
  | AudioChunkMessage
  | STTPartialMessage 
  | STTFinalMessage
  | TTSChunkMessage
  | EventMessage
  | ErrorMessage
  | PingMessage
  | PongMessage
  | StartSessionMessage
  | TTSStopMessage;

export interface AudioChunkMessage {
  type: 'audio_chunk';
  data: {
    audioData: string; // base64 encoded audio
    timestamp: number;
  };
}

export interface STTPartialMessage {
  type: 'stt_partial';
  data: {
    text: string;
    timestamp: number;
  };
}

export interface STTFinalMessage {
  type: 'stt_final';
  data: {
    text: string;
    timestamp: number;
  };
}

export interface TTSChunkMessage {
  type: 'tts_chunk';
  data: {
    audioChunk: string; // base64 encoded audio
    timestamp: number;
  };
}

export interface EventMessage {
  type: 'event';
  data: {
    name: string;
    details?: any;
    timestamp?: number;
  };
}

export interface ErrorMessage {
  type: 'error';
  data: {
    message: string;
    code?: string;
    timestamp?: number;
  };
}

export interface PingMessage {
  type: 'ping';
  data: {
    timestamp: number;
  };
}

export interface PongMessage {
  type: 'pong';
  data: {
    timestamp: number;
  };
}

export interface StartSessionMessage {
  type: 'start_session';
  data?: any;
}

export interface TTSStopMessage {
  type: 'tts_stop';
  data?: any;
}

export type RealtimeWSMessageType = 'error' | 'event' | 'ping' | 'pong' | 'audio_chunk' | 'stt_partial' | 'stt_final' | 'tts_chunk' | 'start_session' | 'tts_stop';

export interface SessionMetrics {
  sessionId: string;
  interruptions: number;
  totalAudioDuration: number;
  conversationTurns: number;
  tFirstPartial?: number;
  tFirstAudio?: number;
  tLLMFirstToken?: number;
  tTTSFirstAudio?: number;
}