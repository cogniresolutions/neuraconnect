import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
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

      // Load and register the audio worklet
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio-data') {
          this.onAudioData(new Float32Array(event.data.audioData));
        }
      };
      
      this.source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
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
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
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

  constructor(private onMessage: (event: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(persona: any) {
    try {
      this.persona = persona;
      console.log('Initializing chat with persona:', persona);
      
      const { data: response, error } = await supabase.functions.invoke('realtime-chat', {
        body: { 
          persona: {
            name: persona.name,
            description: persona.description,
            personality: persona.personality,
            skills: persona.skills,
            topics: persona.topics,
            model_config: persona.model_config,
            voice_style: persona.voice_style
          }
        }
      });

      if (error || !response?.client_secret?.value) {
        console.error('Error getting token:', error);
        throw new Error('Failed to get ephemeral token');
      }

      const EPHEMERAL_KEY = response.client_secret.value;

      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      this.pc.ontrack = e => {
        console.log('Received remote track:', e.track.kind);
        this.audioEl.srcObject = e.streams[0];
      };

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      ms.getTracks().forEach(track => {
        this.pc.addTrack(track, ms);
      });

      this.dc = this.pc.createDataChannel("oai-events", {
        ordered: true
      });
      
      this.dc.onopen = () => {
        console.log('Data channel opened');
        this.sendSystemMessage();
      };
      
      this.dc.onclose = () => console.log('Data channel closed');
      this.dc.onerror = (error) => console.error('Data channel error:', error);
      
      this.dc.onmessage = (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event);
        this.onMessage(event);
      };

      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await this.pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`Failed to connect to OpenAI: ${errorText}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

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
      console.error("Error initializing chat:", error);
      throw error;
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

  private sendSystemMessage() {
    if (!this.dc || this.dc.readyState !== 'open' || !this.persona) {
      console.error('Data channel not ready or persona not set');
      return;
    }

    const systemMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: `You are ${this.persona.name}, an AI assistant with the following personality: ${this.persona.personality}. 
                  You have expertise in: ${JSON.stringify(this.persona.skills)}. 
                  You should focus on discussing topics related to: ${this.persona.topics.join(', ')}.`
          }
        ]
      }
    };

    console.log('Sending system message:', systemMessage);
    this.dc.send(JSON.stringify(systemMessage));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  sendMessage(data: number[] | Float32Array | string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.error('Data channel not ready');
      return;
    }

    if (typeof data === 'string') {
      // Handle text messages with correct type
      const message = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: data
            }
          ]
        }
      };
      this.dc.send(JSON.stringify(message));
      this.dc.send(JSON.stringify({type: 'response.create'}));
    } else {
      // Handle audio data
      const float32Data = data instanceof Float32Array 
        ? data 
        : new Float32Array(data);

      const encodedAudio = this.encodeAudioData(float32Data);
      const message = {
        type: 'input_audio_buffer.append',
        audio: encodedAudio,
        timestamp: Date.now()
      };

      this.dc.send(JSON.stringify(message));
    }
  }

  disconnect() {
    console.log('Disconnecting chat...');
    this.recorder?.stop();
    if (this.dc?.readyState === 'open') {
      this.dc.close();
    }
    if (this.pc) {
      this.pc.close();
    }
    this.audioEl.srcObject = null;
  }
}
