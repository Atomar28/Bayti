import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: number;
  text: string;
  timestamp: Date;
  type: 'sent' | 'received' | 'system';
}

export default function EchoTest() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [messageId, setMessageId] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/echo`;
  };

  const addMessage = (text: string, type: 'sent' | 'received' | 'system') => {
    setMessages(prev => [...prev, {
      id: messageId,
      text,
      timestamp: new Date(),
      type
    }]);
    setMessageId(prev => prev + 1);
  };

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionStatus('connecting');
    addMessage('Connecting to echo WebSocket...', 'system');
    
    const wsUrl = getWebSocketUrl();
    console.log('Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Echo WebSocket connected');
      setConnectionStatus('connected');
      addMessage('Connected to echo server', 'system');
    };

    ws.onmessage = (event) => {
      console.log('Echo received:', event.data);
      addMessage(event.data, 'received');
    };

    ws.onclose = (event) => {
      console.log('Echo WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      addMessage(`Connection closed (${event.code}: ${event.reason || 'No reason'})`, 'system');
    };

    ws.onerror = (error) => {
      console.error('Echo WebSocket error:', error);
      setConnectionStatus('error');
      addMessage('Connection error occurred', 'system');
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || connectionStatus !== 'connected' || !wsRef.current) return;
    
    console.log('Sending:', inputMessage);
    wsRef.current.send(inputMessage);
    addMessage(inputMessage, 'sent');
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            WebSocket Echo Test
            <Badge variant="outline" className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              {getStatusText()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Test the WebSocket connection by sending messages to the echo server
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={connect} 
              disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
              variant="outline"
            >
              Connect
            </Button>
            <Button 
              onClick={disconnect} 
              disabled={connectionStatus === 'disconnected'}
              variant="outline"
            >
              Disconnect
            </Button>
            <Button 
              onClick={() => setMessages([])}
              variant="ghost"
            >
              Clear Messages
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message to echo..."
              disabled={connectionStatus !== 'connected'}
            />
            <Button 
              onClick={sendMessage}
              disabled={connectionStatus !== 'connected' || !inputMessage.trim()}
            >
              Send
            </Button>
          </div>

          {/* Messages */}
          <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50 space-y-2">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No messages yet. Connect and send a message to test the echo.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.type === 'sent' 
                      ? 'bg-blue-500 text-white' 
                      : message.type === 'received'
                      ? 'bg-white border'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <div className="text-sm">{message.text}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Connection Info */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>WebSocket URL:</strong> {getWebSocketUrl()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}