import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  stop(): Blob {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    const audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
    this.chunks = [];
    return audioBlob;
  }
}

export class RealtimeChat {
  private audioRecorder: AudioRecorder;
  private persona: any;
  private messageHandler: (event: any) => void;
  private ws: WebSocket | null = null;

  constructor(messageHandler: (event: any) => void) {
    this.audioRecorder = new AudioRecorder();
    this.messageHandler = messageHandler;
  }

  async init(persona: any): Promise<void> {
    this.persona = persona;
    
    try {
      await this.audioRecorder.start();
      
      // Connect to our Edge Function WebSocket
      const { data: { url } } = await supabase.functions.invoke('realtime-chat');
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.messageHandler({ type: 'connection.established' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandler(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.messageHandler({ 
          type: 'error',
          error: 'WebSocket connection error'
        });
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.messageHandler({ type: 'connection.closed' });
      };

    } catch (error) {
      console.error('Error initializing chat:', error);
      throw error;
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not ready');
    }

    this.ws.send(JSON.stringify({
      text,
      systemPrompt: `You are ${this.persona.name}, ${this.persona.description}. 
                     Your personality is: ${this.persona.personality}.
                     Your skills include: ${this.persona.skills.join(', ')}.
                     You are knowledgeable about: ${this.persona.topics.join(', ')}.`
    }));
  }

  disconnect(): void {
    this.audioRecorder.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}