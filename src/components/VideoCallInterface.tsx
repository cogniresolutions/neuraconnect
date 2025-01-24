import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import LocalVideo from './video/LocalVideo';
import RemoteVideo from './video/RemoteVideo';
import VideoControls from './video/VideoControls';

interface VideoCallInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
  onCallStateChange?: (isActive: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({ 
  persona, 
  onSpeakingChange,
  onCallStateChange 
}) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const mountedRef = useRef(false);

  const cleanup = useCallback(() => {
    console.log('Running cleanup in VideoCallInterface');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (chatRef.current) {
      chatRef.current.disconnect();
    }
    setStream(null);
    setIsCallActive(false);
    onCallStateChange?.(false);
  }, [stream, onCallStateChange]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const startCamera = async () => {
    try {
      cleanup();

      // Initialize chat connection first
      chatRef.current = new RealtimeChat((event) => {
        if (event.type === 'response.audio.delta') {
          onSpeakingChange(true);
        } else if (event.type === 'response.audio.done') {
          onSpeakingChange(false);
        }
      });

      await chatRef.current.init(persona);

      // Wait for video elements to be ready
      await new Promise<void>((resolve) => {
        const checkRefs = () => {
          if (localVideoRef.current && remoteVideoRef.current) {
            console.log('Video elements are ready');
            resolve();
          } else {
            console.log('Waiting for video elements...');
            setTimeout(checkRefs, 100);
          }
        };
        checkRefs();
      });

      console.log('Requesting media stream...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Setting up media stream...');
      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
        await localVideoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          throw error;
        });
      }

      // Initialize audio context
      audioContextRef.current = new AudioContext();
      
      setIsCallActive(true);
      onCallStateChange?.(true);
      
      toast({
        title: "Call Connected",
        description: `You're now in a call with ${persona.name}`,
      });

      console.log('Camera and audio initialized successfully');
    } catch (error) {
      console.error('Camera/audio initialization error:', error);
      cleanup();
      
      toast({
        title: "Connection Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      
      toast({
        title: isAudioEnabled ? "Microphone Muted" : "Microphone Unmuted",
        description: isAudioEnabled ? "Others cannot hear you" : "Others can now hear you",
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      
      toast({
        title: isVideoEnabled ? "Camera Off" : "Camera On",
        description: isVideoEnabled ? "Your camera is now off" : "Your camera is now on",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <LocalVideo onVideoRef={(ref) => localVideoRef.current = ref} />
          </div>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <RemoteVideo onVideoRef={(ref) => remoteVideoRef.current = ref} />
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <VideoControls
            isCallActive={isCallActive}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            onStartCall={startCamera}
            onEndCall={cleanup}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;