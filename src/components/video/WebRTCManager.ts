import { supabase } from '@/integrations/supabase/client';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream) => void;
  private config: WebRTCConfig;

  constructor(onRemoteStream: (stream: MediaStream) => void) {
    this.onRemoteStream = onRemoteStream;
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
  }

  async initializeLocalStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      console.log('Requesting media access with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media access granted:', this.localStream.getTracks().map(t => t.kind));
      return this.localStream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      throw new Error(`Failed to access media devices: ${error.message}`);
    }
  }

  async initializePeerConnection(): Promise<void> {
    try {
      console.log('Initializing WebRTC peer connection');
      this.peerConnection = new RTCPeerConnection(this.config);

      // Add local tracks to the peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            console.log('Adding track to peer connection:', track.kind);
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      // Handle incoming remote streams
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        this.onRemoteStream(event.streams[0]);
      };

      // Log ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          await this.sendIceCandidate(event.candidate);
        }
      };

    } catch (error) {
      console.error('Error initializing peer connection:', error);
      throw error;
    }
  }

  private async sendIceCandidate(candidate: RTCIceCandidate) {
    try {
      const { error } = await supabase.functions.invoke('webrtc-signaling', {
        body: {
          type: 'ice-candidate',
          candidate
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Creating offer');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('Setting remote description from answer');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}