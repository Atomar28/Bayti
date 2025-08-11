import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import { RealtimeOrchestrator } from "./orchestrator.js";
import type { 
  RealtimeWSMessage, 
  RealtimeSession, 
  AudioChunkMessage,
  BargeinMessage 
} from "./types.js";

// Create Express app for realtime mode
const app = express();

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'bayti-realtime',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const httpServer = createServer(app);

// WebSocket server for realtime communication
const wss = new WebSocketServer({ 
  server: httpServer, 
  path: '/ws/realtime' 
});

// Store active sessions
const activeSessions = new Map<string, {
  session: RealtimeSession;
  orchestrator: RealtimeOrchestrator;
  ws: WebSocket;
  lastPing: number;
}>();

// Connection handler
wss.on('connection', (ws, req) => {
  console.log('New realtime WebSocket connection');

  // Create session
  const session: RealtimeSession = {
    id: randomUUID(),
    startedAt: new Date(),
    clientIP: req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  // Create orchestrator
  const orchestrator = new RealtimeOrchestrator(session);

  // Store session
  activeSessions.set(session.id, {
    session,
    orchestrator,
    ws,
    lastPing: Date.now()
  });

  // Setup orchestrator event handlers
  orchestrator.on('stt:partial', (text, timestamp) => {
    sendMessage(ws, {
      type: 'stt:partial',
      data: { text, timestamp }
    });
  });

  orchestrator.on('stt:final', (text, timestamp) => {
    sendMessage(ws, {
      type: 'stt:final',
      data: { text, timestamp }
    });
  });

  orchestrator.on('tts:chunk', (audioChunk, timestamp) => {
    // Convert audio chunk to base64
    const audioBase64 = Buffer.from(audioChunk).toString('base64');
    sendMessage(ws, {
      type: 'tts:chunk',
      data: { audio: audioBase64, timestamp }
    });
  });

  orchestrator.on('tts:stop', (reason, timestamp) => {
    sendMessage(ws, {
      type: 'tts:stop',
      data: { reason, timestamp }
    });
  });

  orchestrator.on('event', (name, details, timestamp) => {
    sendMessage(ws, {
      type: 'event',
      data: { name, details, timestamp: timestamp || Date.now() }
    });
  });

  orchestrator.on('error', (message, code, timestamp) => {
    sendMessage(ws, {
      type: 'error',
      data: { message, code, timestamp: timestamp || Date.now() }
    });
  });

  // WebSocket message handler
  ws.on('message', async (data) => {
    try {
      const message: RealtimeWSMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'audio:chunk':
          await handleAudioChunk(session.id, message as AudioChunkMessage);
          break;
          
        case 'audio:bargein':
          handleBargein(session.id, message as BargeinMessage);
          break;
          
        case 'ping':
          // Update last ping and respond with pong
          const sessionData = activeSessions.get(session.id);
          if (sessionData) {
            sessionData.lastPing = Date.now();
            sendMessage(ws, {
              type: 'pong',
              data: { timestamp: Date.now() }
            });
          }
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      sendMessage(ws, {
        type: 'error',
        data: { 
          message: 'Failed to process message', 
          code: 'MESSAGE_PROCESSING_ERROR',
          timestamp: Date.now()
        }
      });
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log(`WebSocket connection closed for session: ${session.id}`);
    cleanupSession(session.id);
  });

  // Handle connection error
  ws.on('error', (error) => {
    console.error(`WebSocket error for session ${session.id}:`, error);
    cleanupSession(session.id);
  });

  // Send welcome message
  sendMessage(ws, {
    type: 'event',
    data: {
      name: 'session_started',
      details: { sessionId: session.id },
      timestamp: Date.now()
    }
  });
});

// Audio chunk handler
async function handleAudioChunk(sessionId: string, message: AudioChunkMessage) {
  const sessionData = activeSessions.get(sessionId);
  if (!sessionData) {
    console.warn(`No session found for ID: ${sessionId}`);
    return;
  }

  try {
    // Decode base64 audio data
    const audioBuffer = Buffer.from(message.data.audio, 'base64');
    
    // Process with orchestrator
    await sessionData.orchestrator.processAudioChunk(audioBuffer, message.data.timestamp);
  } catch (error) {
    console.error('Error handling audio chunk:', error);
    sendMessage(sessionData.ws, {
      type: 'error',
      data: { 
        message: 'Failed to process audio chunk', 
        code: 'AUDIO_CHUNK_ERROR',
        timestamp: Date.now()
      }
    });
  }
}

// Bargein handler
function handleBargein(sessionId: string, message: BargeinMessage) {
  const sessionData = activeSessions.get(sessionId);
  if (!sessionData) return;

  // The orchestrator automatically handles barge-in detection
  // This message is just a hint from the client
  console.log(`Barge-in hint received for session: ${sessionId}`);
}

// Send message helper with backpressure control
function sendMessage(ws: WebSocket, message: RealtimeWSMessage) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    const messageString = JSON.stringify(message);
    
    // Simple backpressure control - drop messages if buffer is too full
    if (ws.bufferedAmount > 1024 * 1024) { // 1MB buffer limit
      console.warn('WebSocket buffer full, dropping message');
      return;
    }

    ws.send(messageString);
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
  }
}

// Cleanup session
function cleanupSession(sessionId: string) {
  const sessionData = activeSessions.get(sessionId);
  if (sessionData) {
    try {
      sessionData.orchestrator.cleanup();
      activeSessions.delete(sessionId);
      console.log(`Session cleaned up: ${sessionId}`);
    } catch (error) {
      console.error(`Error cleaning up session ${sessionId}:`, error);
    }
  }
}

// Keepalive ping/pong system
setInterval(() => {
  const now = Date.now();
  const timeoutMs = 30000; // 30 seconds

  activeSessions.forEach((sessionData, sessionId) => {
    if (now - sessionData.lastPing > timeoutMs) {
      console.log(`Session ${sessionId} timed out, cleaning up`);
      sessionData.ws.close();
      cleanupSession(sessionId);
    } else {
      // Send ping
      sendMessage(sessionData.ws, {
        type: 'ping',
        data: { timestamp: now }
      });
    }
  });
}, 20000); // Ping every 20 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down realtime server...');
  
  // Close all sessions
  activeSessions.forEach((sessionData, sessionId) => {
    sessionData.ws.close();
    cleanupSession(sessionId);
  });
  
  // Close server
  httpServer.close(() => {
    console.log('Realtime server shut down');
    process.exit(0);
  });
});

export { httpServer as realtimeServer, app as realtimeApp };