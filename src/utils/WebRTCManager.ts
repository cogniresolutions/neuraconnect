import { supabase } from '@/integrations/supabase/client';

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;

  constructor(
    private onMessage: (message: any) => void,
    private persona: any
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async initialize() {
    try {
      const { data: response, error } = await supabase.functions.invoke('generate-chat-token', {
        body: { personaId: this.persona.id }
      });

      if (error) throw error;
      if (!response?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
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
        console.log("Data channel opened");
        this.sendSystemPrompt();
      };

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
        throw new Error(`Failed to connect to OpenAI: ${await sdpResponse.text()}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

      return this.dc;
    } catch (error) {
      console.error("Error initializing WebRTC:", error);
      throw error;
    }
  }

  private sendSystemPrompt() {
    if (!this.dc || this.dc.readyState !== 'open') return;

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

    this.dc.send(JSON.stringify(systemMessage));
  }

  sendMessage(data: string | Float32Array) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('Data channel not ready');
      return;
    }

    if (typeof data === 'string') {
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
      this.dc.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: this.encodeAudioData(data)
      }));
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

  cleanup() {
    this.pc?.close();
    this.dc?.close();
    this.audioEl.srcObject = null;
  }
}