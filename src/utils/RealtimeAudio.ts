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
      console.log('Starting audio recorder...');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Audio stream initialized:', this.stream.getAudioTracks()[0].getSettings());
      
      this.audioContext = new AudioContext({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      console.log('Audio processing pipeline established');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    console.log('Stopping audio recorder...');
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped:', track.kind);
      });
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      console.log('Audio context closed');
    }
  }
}

export class RealtimeChat {
  private socket: WebSocket | null = null;
  private messageHandler: MessageHandler;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private clientSecret: string | null = null;
  private wsEndpoint: string | null = null;

  constructor(messageHandler: MessageHandler) {
    this.messageHandler = messageHandler;
    console.log('RealtimeChat initialized with message handler');
  }

  async init(persona: any) {
    try {
      console.log('Initializing chat with persona:', persona);
      console.log('Step 1: Getting Azure OpenAI token and speech configuration...');
      
      const { data, error } = await supabase.functions.invoke('azure-realtime-chat', {
        body: { 
          persona: {
            id: persona.id,
            name: persona.name,
            voice_style: persona.voice_style,
            personality: persona.personality,
            skills: persona.skills || [],
            topics: persona.topics || []
          }
        }
      });

      if (error) throw error;
      if (!data?.token) throw new Error('No token received');
      if (!data?.endpoint) throw new Error('No endpoint received from token generation');

      console.log('Step 2: Token received, configuring WebSocket connection...');
      this.clientSecret = data.token;
      this.wsEndpoint = data.endpoint;
      
      console.log('Step 3: Establishing WebSocket connection...');
      await this.establishWebSocketConnection();

      console.log('Step 4: WebSocket connection established successfully');
      console.log('Step 5: Ready for real-time communication');

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
    if (!this.clientSecret || !this.wsEndpoint) {
      console.error('Missing required credentials');
      throw new Error('Missing required credentials for WebSocket connection');
    }

    console.log('Establishing WebSocket connection...');
    
    try {
      const baseUrl = this.wsEndpoint.endsWith('/') ? this.wsEndpoint.slice(0, -1) : this.wsEndpoint;
      const wsUrl = new URL(`${baseUrl}/openai/deployments/gpt-4o-realtime-preview/chat/realtime/stream`);
      wsUrl.searchParams.append('api-version', '2024-12-17');
      wsUrl.searchParams.append('token', this.clientSecret);
      
      console.log('Connecting to WebSocket with URL:', wsUrl.toString());
      
      this.socket = new WebSocket(wsUrl.toString());
      
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
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      throw error;
    }
  }

  private authenticate() {
    if (!this.socket || !this.clientSecret) {
      console.error('Cannot authenticate: missing credentials or socket connection');
      return;
    }

    const authMessage = {
      type: 'auth',
      token: this.clientSecret
    };

    console.log('Sending authentication message');
    this.socket.send(JSON.stringify(authMessage));
  }

  sendMessage(content: string | number[]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      console.log('Step 1: Sending message to Azure OpenAI...');
      const message = typeof content === 'string' 
        ? { 
            type: 'text', 
            content
          }
        : { 
            type: 'audio', 
            content
          };
      
      console.log('Step 2: Message formatted, sending through WebSocket...');
      this.socket.send(JSON.stringify(message));
      console.log('Step 3: Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageHandler({
        type: 'error',
        error: new Error('Failed to send message')
      });
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket and cleaning up resources...');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
