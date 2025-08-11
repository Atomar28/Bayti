// Re-export types from server for client use
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