import { supabase } from '@/integrations/supabase/client';

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
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private persona: any;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(private messageCallback: (event: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(persona: any) {
    try {
      this.persona = persona;
      console.log('Initializing chat with persona:', persona);
      
      const { data, error } = await supabase.functions.invoke('generate-chat-token', {
        body: { 
          personaId: persona.id,
          config: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality,
            skills: persona.skills,
            topics: persona.topics
          }
        }
      });

      if (error) {
        console.error('Error getting chat token:', error);
        throw error;
      }
      
      if (!data?.client_secret?.value) {
        console.error('No client secret received:', data);
        throw new Error('No client secret received');
      }

      console.log('Connecting to WebSocket with token');
      await this.setupWebRTC(data.client_secret.value);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      throw error;
    }
  }

  private async setupWebRTC(token: string) {
    try {
      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = (e) => {
        console.log('Received remote track:', e.track.kind);
        if (this.audioEl) {
          this.audioEl.srcObject = e.streams[0];
        }
      };

      // Add local audio track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => this.pc?.addTrack(track, stream));

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("Received event:", event);
          this.messageCallback(event);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      console.log('Connecting to OpenAI Realtime API');
      const response = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/sdp"
        },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error(`Failed to connect to OpenAI: ${response.statusText}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await response.text()
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

      // Start recording
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: this.encodeAudioData(audioData)
          }));
        }
      });
      await this.recorder.start();

    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        await this.setupWebRTC(token);
      } else {
        throw error;
      }
    }
  }

  updateContext(context: any) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('Data channel not ready for context update');
      return;
    }

    try {
      console.log('Updating conversation context:', context);
      this.dc.send(JSON.stringify({
        type: 'conversation.context.update',
        context
      }));
    } catch (error) {
      console.error('Error updating context:', error);
    }
  }

  private encodeAudioData(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  sendMessage(message: any) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.error('Data channel not ready');
      throw new Error('Data channel not ready');
    }

    try {
      if (typeof message === 'string') {
        const event = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: message
              }
            ]
          }
        };
        console.log('Sending text message:', event);
        this.dc.send(JSON.stringify(event));
      } else {
        console.log('Sending audio data');
        this.dc.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: message
        }));
      }
      
      // Request a response
      this.dc.send(JSON.stringify({type: 'response.create'}));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  disconnect() {
    console.log('Disconnecting chat');
    this.recorder?.stop();
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.audioEl.srcObject = null;
  }
}
