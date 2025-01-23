import { supabase } from "@/integrations/supabase/client";

interface RealtimeAudioConfig {
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: string) => void;
}

export class RealtimeAudio {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: RealtimeAudioConfig;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor(config: RealtimeAudioConfig) {
    this.config = config;
    console.log('RealtimeAudio initialized with config:', config);
  }

  async initialize() {
    try {
      console.log('Initializing RealtimeAudio...');
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      this.setupPeerConnectionListeners();
      this.setupDataChannel();

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('Local description set:', offer);

      return offer;
    } catch (error) {
      console.error('Error initializing RealtimeAudio:', error);
      this.handleError(error as Error);
      throw error;
    }
  }

  private setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      console.log('ICE candidate:', event.candidate);
      if (event.candidate) {
        this.updateContext({ iceCandidate: event.candidate });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      this.config.onStateChange?.(state || 'unknown');

      if (state === 'failed' && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        this.handleReconnection();
      }
    };
  }

  private setupDataChannel() {
    if (!this.peerConnection) return;

    this.dataChannel = this.peerConnection.createDataChannel('audio');
    console.log('Data channel created');

    this.dataChannel.onmessage = (event) => {
      console.log('Data channel message received:', event.data);
      this.config.onData?.(event.data);
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.handleError(error);
    };
  }

  private async updateContext(context: any) {
    try {
      const { error } = await supabase.functions.invoke('realtime-chat', {
        body: { context }
      });

      if (error) {
        console.error('Error updating context:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update context:', error);
      this.handleError(error as Error);
    }
  }

  private async handleReconnection() {
    console.log('Attempting reconnection...');
    this.reconnectAttempts++;
    try {
      await this.initialize();
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.handleError(error as Error);
    }
  }

  private handleError(error: Error) {
    console.error('RealtimeAudio error:', error);
    this.config.onError?.(error);
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection not initialized');
      }
      console.log('Setting remote description:', answer);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      this.handleError(error as Error);
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (!this.peerConnection) {
        throw new Error('PeerConnection not initialized');
      }
      console.log('Adding ICE candidate:', candidate);
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      this.handleError(error as Error);
    }
  }

  close() {
    console.log('Closing RealtimeAudio connection');
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
  }
}