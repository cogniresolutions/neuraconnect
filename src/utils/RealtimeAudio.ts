import { supabase } from "@/integrations/supabase/client";

class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      const tracks = this.mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    this.audioChunks = [];
  }

  getAudioChunks() {
    return this.audioChunks;
  }

  clearAudioChunks() {
    this.audioChunks = [];
  }
}

export class RealtimeChat {
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder;
  private messageHandler: (event: any) => void;
  private persona: any;

  constructor(messageHandler: (event: any) => void) {
    this.audioRecorder = new AudioRecorder();
    this.messageHandler = messageHandler;
    this.ws = null;
  }

  async init(persona: any) {
    try {
      this.persona = persona;
      console.log('Initializing chat with persona:', persona);

      // Start recording audio
      await this.audioRecorder.start();
      
      // Get WebSocket URL from Edge Function
      console.log('Requesting WebSocket URL...');
      const { data, error } = await supabase.functions.invoke('realtime-chat', {
        body: { 
          persona: {
            name: persona.name,
            description: persona.description,
            personality: persona.personality,
            skills: persona.skills || [],
            topics: persona.topics || [],
            model_config: persona.model_config,
            voice_style: persona.voice_style
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to get WebSocket URL: ${error.message}`);
      }

      if (!data || !data.url) {
        console.error('Invalid response from edge function:', data);
        throw new Error('No WebSocket URL received from server');
      }

      console.log('Received WebSocket URL:', data.url);
      
      // Initialize WebSocket connection
      this.ws = new WebSocket(data.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.messageHandler(message);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

    } catch (error) {
      console.error('Error initializing chat:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.audioRecorder.stop();
  }

  sendMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const audioChunks = this.audioRecorder.getAudioChunks();
    const message = {
      type: 'message',
      text,
      audioChunks
    };

    this.ws.send(JSON.stringify(message));
    this.audioRecorder.clearAudioChunks();
  }
}