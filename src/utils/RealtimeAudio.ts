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

  private checkAudioLevel = () => {
    if (!this.audioContext || !this.source) return;
    
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    this.source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let lastSpeakingState = false;
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const analyze = () => {
      if (!this.audioContext) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const isSpeaking = average > 30;
      
      // Only emit speaking state change if it's different from last state
      if (isSpeaking !== lastSpeakingState) {
        // Clear existing timeout
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        
        // Set new timeout to debounce the state change
        debounceTimeout = setTimeout(() => {
          if (isSpeaking !== lastSpeakingState) {
            lastSpeakingState = isSpeaking;
            this.onAudioData(new Float32Array([isSpeaking ? 1 : 0]));
            console.log('Speaking state changed:', isSpeaking);
          }
        }, 500); // Debounce for 500ms
      }
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  };

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
      if (!data?.token) throw new Error('No token received');

      this.clientSecret = data.token;
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
    
    try {
      const wsUrl = new URL(`${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o-realtime-preview/chat/realtime/stream?api-version=2024-12-17`);
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
