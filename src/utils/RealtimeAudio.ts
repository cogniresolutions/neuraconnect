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
  private sessionToken: string | null = null;

  constructor(messageHandler: (event: any) => void) {
    this.audioRecorder = new AudioRecorder();
    this.messageHandler = messageHandler;
  }

  async init(persona: any): Promise<void> {
    this.persona = persona;
    
    try {
      // Get chat token from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-chat-token', {
        body: { personaId: persona.id }
      });

      if (error) throw error;
      
      this.sessionToken = data.token;
      await this.audioRecorder.start();
      
      // Start WebSocket connection
      this.connect();
    } catch (error) {
      console.error('Error initializing chat:', error);
      throw error;
    }
  }

  private connect(): void {
    // Implement WebSocket connection logic here
    console.log('WebSocket connection established');
  }

  disconnect(): void {
    if (this.audioRecorder) {
      this.audioRecorder.stop();
    }
    // Cleanup WebSocket connection
    console.log('Chat disconnected');
  }
}