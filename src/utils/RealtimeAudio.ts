import { supabase } from "@/integrations/supabase/client";

interface MessageHandler {
  (event: any): void;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class RealtimeChat {
  private socket: WebSocket | null = null;
  private messageHandler: MessageHandler;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private accessToken: string | null = null;
  private clientSecret: string | null = null;

  constructor(messageHandler: MessageHandler) {
    this.messageHandler = messageHandler;
    console.log('RealtimeChat initialized with message handler');
  }

  async init(persona: any) {
    try {
      console.log('Initializing chat with persona:', persona);
      
      // Get chat token from Supabase function
      const { data, error } = await supabase.functions.invoke('generate-chat-token', {
        body: { 
          personaId: persona.id,
          config: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality,
            skills: persona.skills || [],
            topics: persona.topics || []
          }
        }
      });

      if (error) throw error;
      if (!data?.client_secret) throw new Error('No client secret received');

      this.clientSecret = data.client_secret;
      console.log('Successfully received chat token');

      await this.establishWebSocketConnection();

    } catch (error) {
      console.error('Error initializing chat:', error);
      this.messageHandler({
        type: 'error',
        error: error instanceof Error ? error : new Error('Failed to initialize chat')
      });
      throw error;
    }
  }

  private async establishWebSocketConnection() {
    if (!this.clientSecret) {
      console.error('Missing client secret');
      throw new Error('Missing client secret');
    }

    console.log('Establishing WebSocket connection...');
    
    // Create WebSocket URL with authentication parameters
    const wsUrl = new URL('wss://api.openai.com/v1/realtime');
    wsUrl.searchParams.append('client_secret', this.clientSecret);
    
    // Initialize WebSocket with the 'openai-realtime' subprotocol
    this.socket = new WebSocket(wsUrl.toString(), 'openai-realtime');
    
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.authenticate();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        this.messageHandler(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.messageHandler({
          type: 'error',
          error: new Error('Failed to parse WebSocket message')
        });
      }
    };

    this.socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.messageHandler({
        type: 'error',
        error: new Error('WebSocket connection error')
      });
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        console.log('Attempting to reconnect...');
        this.reconnectAttempts++;
        setTimeout(() => this.establishWebSocketConnection(), 1000 * Math.pow(2, this.reconnectAttempts));
      } else {
        this.messageHandler({
          type: 'error',
          error: new Error('WebSocket connection closed')
        });
      }
    };
  }

  private authenticate() {
    if (!this.socket || !this.clientSecret) {
      console.error('Cannot authenticate: missing credentials or socket connection');
      return;
    }

    const authMessage = {
      type: 'auth',
      client_secret: this.clientSecret
    };

    console.log('Sending authentication message:', {
      ...authMessage,
      client_secret: '[REDACTED]'
    });
    
    this.socket.send(JSON.stringify(authMessage));
  }

  sendMessage(content: string | number[]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      const message = typeof content === 'string' 
        ? { 
            type: 'text', 
            content
          }
        : { 
            type: 'audio', 
            content
          };
      
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageHandler({
        type: 'error',
        error: new Error('Failed to send message')
      });
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  updateContext(context: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      this.socket.send(JSON.stringify({
        type: 'context',
        context
      }));
    } catch (error) {
      console.error('Error updating context:', error);
    }
  }
}
