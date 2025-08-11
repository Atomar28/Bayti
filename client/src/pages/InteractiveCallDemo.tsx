import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff, Activity } from "lucide-react";
import { createWSConnection, type WSConnection } from "@/lib/ws";
import type { RealtimeWSMessage, STTPartialMessage, STTFinalMessage, TTSChunkMessage, EventMessage, ErrorMessage } from "@/types/realtime";

interface SessionMetrics {
  tFirstPartial?: number;
  tFirstAudio?: number;
  interruptions: number;
  conversationTurns: number;
}

export default function InteractiveCallDemo() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  // Audio state
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isPlaying, setIsPlaying] = useState(false);

  // Conversation state
  const [partialTranscript, setPartialTranscript] = useState('');
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'assistant';
    text: string;
    timestamp: number;
  }>>([]);

  // Metrics state
  const [metrics, setMetrics] = useState<SessionMetrics>({
    interruptions: 0,
    conversationTurns: 0
  });

  // Refs
  const wsRef = useRef<WSConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<Uint8Array[]>([]);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Create WebSocket connection
  const createConnection = useCallback(() => {
    // ALWAYS build from origin, not current page path
    const wsBase = window.location.origin.replace(/^http/i, "ws").replace(/\/$/, "");
    const wsUrl = `${wsBase}/ws/realtime`;
    console.log('🔗 Connecting to WebSocket:', wsUrl);
    
    const ws = createWSConnection({
      url: wsUrl,
      autoReconnect: true,
      maxReconnectAttempts: 3,
      reconnectInterval: 3000,
      heartbeatInterval: 20000
    });

    ws.onOpen(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
      console.log('Connected to realtime server');
      
      // Initialize session
      ws.send({
        type: 'start_session',
        data: { timestamp: Date.now() }
      });
    });

    ws.onClose(() => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.log('Disconnected from realtime server');
    });

    ws.onError((error) => {
      setConnectionStatus('error');
      console.error('WebSocket error:', error);
    });

    ws.onMessage((message: RealtimeWSMessage) => {
      handleWebSocketMessage(message);
    });

    return ws;
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: RealtimeWSMessage) => {
    switch (message.type) {
      case 'stt_partial':
        const partialMsg = message as STTPartialMessage;
        setPartialTranscript(partialMsg.data.text);
        
        // Update metrics on first partial
        if (!metrics.tFirstPartial) {
          setMetrics(prev => ({
            ...prev,
            tFirstPartial: Date.now()
          }));
        }
        break;

      case 'stt_final':
        const finalMsg = message as STTFinalMessage;
        setPartialTranscript('');
        
        // Add to conversation
        setConversation(prev => [...prev, {
          type: 'user',
          text: finalMsg.data.text,
          timestamp: finalMsg.data.timestamp
        }]);
        
        setMetrics(prev => ({
          ...prev,
          conversationTurns: prev.conversationTurns + 1
        }));
        break;

      case 'tts_chunk':
        const ttsMsg = message as TTSChunkMessage;
        handleAudioChunk(ttsMsg.data.audioChunk);
        
        // Update metrics on first audio
        if (!metrics.tFirstAudio) {
          setMetrics(prev => ({
            ...prev,
            tFirstAudio: Date.now()
          }));
        }
        break;

      case 'tts_stop':
        setIsPlaying(false);
        stopAudioPlayback();
        break;

      case 'event':
        const eventMsg = message as EventMessage;
        console.log('Event:', eventMsg.data.name, eventMsg.data.details);
        
        // Handle specific events
        if (eventMsg.data.name === 'barge_in_detected') {
          setMetrics(prev => ({
            ...prev,
            interruptions: prev.interruptions + 1
          }));
        }
        break;

      case 'error':
        const errorMsg = message as ErrorMessage;
        console.error('Server error:', errorMsg.data.message);
        break;
    }
  }, [metrics.tFirstPartial, metrics.tFirstAudio]);

  // Audio chunk handling
  const handleAudioChunk = useCallback(async (audioBase64: string) => {
    try {
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      audioQueueRef.current.push(audioBytes);
      
      if (!isPlaying) {
        setIsPlaying(true);
        await playAudioQueue();
      }
    } catch (error) {
      console.error('Error handling audio chunk:', error);
    }
  }, [isPlaying]);

  // Audio playback
  const playAudioQueue = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    
    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (!audioData) continue;

      try {
        // Decode audio data (assuming MP3)
        const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);
        
        // Create and play audio source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        audioSourceRef.current = source;
        
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      } catch (error) {
        console.error('Error playing audio chunk:', error);
      }
    }
    
    setIsPlaying(false);
  }, []);

  // Stop audio playback
  const stopAudioPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (error) {
        // Already stopped
      }
      audioSourceRef.current = null;
    }
    audioQueueRef.current = [];
    setIsPlaying(false);
  }, []);

  // Microphone setup
  const setupMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;
      setMicPermission('granted');

      // Setup audio processing
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      
      // Use ScriptProcessorNode for compatibility (AudioWorklet would be better but more complex)
      const processor = audioContext.createScriptProcessor(1024, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (!isRecording || !wsRef.current) return;

        const inputBuffer = event.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array (PCM16)
        const pcm16 = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputBuffer[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Convert to base64 and send
        const pcm16Array = new Uint8Array(pcm16.buffer);
        const audioBase64 = btoa(String.fromCharCode.apply(null, Array.from(pcm16Array)));
        
        // Calculate RMS to check if audio has meaningful content
        const rms = Math.sqrt(inputBuffer.reduce((sum, sample) => sum + sample * sample, 0) / inputBuffer.length);
        console.log('🎵 Audio RMS level:', rms.toFixed(6), '- Sending:', rms >= 0.001);
        
        if (rms < 0.001) {
          // Skip very quiet samples to avoid sending silence
          return;
        }
        
        console.log('🎵 Sending audio chunk to server, size:', pcm16.length, 'samples');
        
        const audioMessage: RealtimeWSMessage = {
          type: 'audio_chunk',
          data: {
            audioData: audioBase64,
            timestamp: Date.now()
          }
        };

        wsRef.current.send(audioMessage);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      audioWorkletRef.current = processor as any;

      return true;
    } catch (error) {
      console.error('Error setting up microphone:', error);
      setMicPermission('denied');
      return false;
    }
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (micPermission !== 'granted') {
      const success = await setupMicrophone();
      if (!success) return;
    }

    console.log('🎙️  Starting audio recording...');
    setIsRecording(true);
  }, [micPermission, setupMicrophone]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping audio recording...');
    setIsRecording(false);
  }, []);

  // Connect to server
  const connectToServer = useCallback(async () => {
    if (isConnected) return;

    setConnectionStatus('connecting');
    try {
      wsRef.current = createConnection();
      await wsRef.current.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus('error');
    }
  }, [isConnected, createConnection]);

  // Disconnect from server
  const disconnectFromServer = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    
    setIsRecording(false);
    stopAudioPlayback();
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stopAudioPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromServer();
    };
  }, [disconnectFromServer]);

  // Calculate latency metrics
  const formatLatency = (ms?: number) => {
    if (!ms) return 'N/A';
    return `${ms}ms`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Interactive Call Demo</h1>
          <p className="text-gray-600">
            Real-time AI conversation with speech-to-text and text-to-speech
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
                }`} />
                <span className="capitalize">{connectionStatus}</span>
              </div>
              
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button onClick={connectToServer} disabled={connectionStatus === 'connecting'}>
                    <Phone className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                ) : (
                  <Button onClick={disconnectFromServer} variant="destructive">
                    <PhoneOff className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                }`} />
                <span>{isRecording ? 'Recording...' : 'Not recording'}</span>
                {isPlaying && (
                  <span className="text-blue-600 text-sm">• AI Speaking</span>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording} 
                    disabled={!isConnected || micPermission === 'denied'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive">
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
            </div>

            {micPermission === 'denied' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">
                  Microphone permission denied. Please enable microphone access and refresh the page.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Transcript */}
        {(partialTranscript || isRecording) && (
          <Card>
            <CardHeader>
              <CardTitle>Live Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[50px] p-3 bg-gray-50 border rounded-md">
                <p className="text-gray-800">
                  {partialTranscript || (isRecording ? 'Listening...' : '')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation History */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversation.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Start a conversation by connecting and speaking...
                </p>
              ) : (
                conversation.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-semibold text-gray-900">
                  {formatLatency(metrics.tFirstPartial)}
                </div>
                <div className="text-sm text-gray-600">First Partial</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-semibold text-gray-900">
                  {formatLatency(metrics.tFirstAudio)}
                </div>
                <div className="text-sm text-gray-600">First Audio</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-semibold text-gray-900">
                  {metrics.interruptions}
                </div>
                <div className="text-sm text-gray-600">Interruptions</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <div className="text-lg font-semibold text-gray-900">
                  {metrics.conversationTurns}
                </div>
                <div className="text-sm text-gray-600">Turns</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}