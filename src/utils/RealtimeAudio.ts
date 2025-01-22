import { supabase } from "@/integrations/supabase/client";

class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async start() {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('Audio chunk recorded, size:', event.data.size);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      console.log('Started recording audio');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      console.log('Stopping audio recording');
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
      if (!persona) {
        throw new Error('No persona provided');
      }

      this.persona = persona;
      console.log('Initializing chat with persona:', persona);

      // Start recording audio
      await this.audioRecorder.start();
      
      // Get WebSocket URL from Edge Function
      console.log('Requesting WebSocket URL...');
      const { data: response, error } = await supabase.functions.invoke('realtime-chat', {
        body: { 
          persona: {
            name: persona.name || '',
            description: persona.description || '',
            personality: persona.personality || '',
            skills: persona.skills || [],
            topics: persona.topics || [],
            model_config: persona.model_config || { model: "gpt-4o-mini" },
            voice_style: persona.voice_style || 'alloy'
          }
        }
      });

      console.log('Edge function response:', response);

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to get WebSocket URL: ${error.message}`);
      }

      if (!response?.url) {
        console.error('Invalid response from edge function:', response);
        throw new Error('No WebSocket URL received from server');
      }

      console.log('Connecting to WebSocket:', response.url);
      
      // Initialize WebSocket connection
      this.ws = new WebSocket(response.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
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
      console.log('Closing WebSocket connection');
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
    console.log('Sending message with', audioChunks.length, 'audio chunks');
    
    const message = {
      type: 'message',
      text,
      audioChunks
    };

    this.ws.send(JSON.stringify(message));
    this.audioRecorder.clearAudioChunks();
  }
}