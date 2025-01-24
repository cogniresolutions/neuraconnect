import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import LocalVideo from './video/LocalVideo';
import RemoteVideo from './video/RemoteVideo';
import VideoControls from './video/VideoControls';

interface VideoCallInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({ persona, onSpeakingChange }) => {
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
  }, [stream]);

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
        audio: true
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

      setIsCallActive(true);
      console.log('Camera initialized successfully');
    } catch (error) {
      console.error('Camera initialization error:', error);
      cleanup();
      throw error;
    }
  };

  const handleSpeechDetected = async (text: string) => {
    if (!chatRef.current || isProcessingAudio) return;
    
    try {
      setIsProcessingAudio(true);
      await chatRef.current.sendMessage(text);
    } catch (error) {
      console.error('Error processing speech:', error);
      toast({
        title: "Error",
        description: "Failed to process speech",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleStartRecording = () => {
    try {
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Your call is now being recorded",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    try {
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Your recording has been saved",
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
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
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isRecording={isRecording}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleRecording={toggleRecording}
            onEndCall={cleanup}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;