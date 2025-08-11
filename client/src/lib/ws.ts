import type { RealtimeWSMessage } from "@/types/realtime";

export interface WSConfig {
  url: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export interface WSConnection {
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (message: RealtimeWSMessage) => boolean;
  onMessage: (callback: (message: RealtimeWSMessage) => void) => void;
  onOpen: (callback: () => void) => void;
  onClose: (callback: () => void) => void;
  onError: (callback: (error: Event) => void) => void;
  isConnected: () => boolean;
}

export function createWSConnection(config: WSConfig): WSConnection {
  let ws: WebSocket | null = null;
  let isConnected = false;
  let reconnectAttempts = 0;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;

  const maxReconnectAttempts = config.maxReconnectAttempts || 5;
  const reconnectInterval = config.reconnectInterval || 3000;
  const heartbeatInterval = config.heartbeatInterval || 20000;

  // Event callbacks
  const callbacks = {
    message: [] as Array<(message: RealtimeWSMessage) => void>,
    open: [] as Array<() => void>,
    close: [] as Array<() => void>,
    error: [] as Array<(error: Event) => void>,
  };

  function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    
    heartbeatTimer = setInterval(() => {
      if (isConnected && ws) {
        const pingMessage: RealtimeWSMessage = {
          type: 'ping',
          data: { timestamp: Date.now() }
        };
        try {
          ws.send(JSON.stringify(pingMessage));
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
    }, heartbeatInterval);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function attemptReconnect() {
    if (!config.autoReconnect || reconnectAttempts >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached or auto-reconnect disabled');
      return;
    }

    reconnectAttempts++;
    console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);

    reconnectTimer = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }

  async function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
          resolve();
          return;
        }

        ws = new WebSocket(config.url);

        ws.onopen = () => {
          console.log('WebSocket connected');
          isConnected = true;
          reconnectAttempts = 0;
          startHeartbeat();
          callbacks.open.forEach(cb => cb());
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message: RealtimeWSMessage = JSON.parse(event.data);
            
            // Handle pong responses
            if (message.type === 'pong') {
              // Just log pong responses, don't emit to callbacks
              console.debug('Received pong');
              return;
            }

            callbacks.message.forEach(cb => cb(message));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          isConnected = false;
          stopHeartbeat();
          callbacks.close.forEach(cb => cb());

          if (config.autoReconnect) {
            attemptReconnect();
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          callbacks.error.forEach(cb => cb(error));
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  function disconnect() {
    isConnected = false;
    stopHeartbeat();
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      ws.close();
      ws = null;
    }
  }

  function send(message: RealtimeWSMessage): boolean {
    if (!ws || !isConnected || ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  return {
    connect,
    disconnect,
    send,
    isConnected: () => isConnected,
    
    onMessage: (callback) => {
      callbacks.message.push(callback);
    },
    
    onOpen: (callback) => {
      callbacks.open.push(callback);
    },
    
    onClose: (callback) => {
      callbacks.close.push(callback);
    },
    
    onError: (callback) => {
      callbacks.error.push(callback);
    }
  };
}