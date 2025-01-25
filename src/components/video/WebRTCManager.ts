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
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ]
    };
  }

  async initializeLocalStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      console.log('Requesting media access with constraints:', constraints);
      
      // First check if we have permissions
      const permissions = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      permissions.getTracks().forEach(track => track.stop());

      // Now get the actual stream with desired constraints
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media access granted:', this.localStream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        settings: t.getSettings()
      })));
      
      return this.localStream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera and microphone access denied. Please allow access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera or microphone found. Please check your device connections.');
      } else {
        throw new Error(`Failed to access media devices: ${error.message}`);
      }
    }
  }

  async initializePeerConnection(): Promise<void> {
    try {
      console.log('Initializing WebRTC peer connection with config:', this.config);
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

      // Log connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state changed:', this.peerConnection?.connectionState);
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
      };

      this.peerConnection.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', this.peerConnection?.iceGatheringState);
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          await this.sendIceCandidate(event.candidate);
        }
      };

      console.log('Peer connection initialized successfully');
    } catch (error) {
      console.error('Error initializing peer connection:', error);
      throw error;
    }
  }

  private async sendIceCandidate(candidate: RTCIceCandidate) {
    try {
      console.log('Sending ICE candidate to signaling server');
      const { error } = await supabase.functions.invoke('webrtc-signaling', {
        body: {
          type: 'ice-candidate',
          candidate
        }
      });
      if (error) throw error;
      console.log('ICE candidate sent successfully');
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
      console.log('Offer created successfully:', offer);
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
      console.log('Remote description set successfully');
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  cleanup(): void {
    console.log('Cleaning up WebRTC resources');
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('Peer connection closed');
    }
  }
}