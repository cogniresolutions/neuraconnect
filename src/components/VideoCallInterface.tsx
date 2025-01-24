import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { cleanupUserSessions } from '@/utils/sessionCleanup';
import LocalVideo from './video/LocalVideo';
import RemoteVideo from './video/RemoteVideo';
import VideoControls from './video/VideoControls';
import { captureAndStoreScreenshot } from '@/utils/screenshotUtils';

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
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [environmentContext, setEnvironmentContext] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const mountedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    console.log('Cleaning up video call resources...');
    try {
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      
      if (chatRef.current) {
        console.log('Disconnecting chat...');
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      if (audioContextRef.current) {
        console.log('Closing audio context...');
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (sessionIdRef.current) {
        console.log('Cleaning up user session:', sessionIdRef.current);
        await cleanupUserSessions(sessionIdRef.current);
        sessionIdRef.current = null;
      }

      setIsCallActive(false);
      setStream(null);
      onCallStateChange?.(false);
      
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const startSpeechRecognition = async () => {
    if (!stream) {
      console.error('No stream available for speech recognition');
      return;
    }

    try {
      setIsSpeechRecognitionActive(true);
      const audioTrack = stream.getAudioTracks()[0];
      
      if (!audioTrack) {
        throw new Error('No audio track available');
      }

      console.log('Initializing audio processing...');
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      processor.onaudioprocess = async (e) => {
        if (!isSpeechRecognitionActive) return;
        const inputData = e.inputBuffer.getChannelData(0);
        console.log('Processing audio data:', inputData.length);
      };

    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsSpeechRecognitionActive(false);
      toast({
        title: "Speech Recognition Error",
        description: "Failed to start speech recognition",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    if (isInitializing) {
      console.log('Already initializing camera...');
      return;
    }
    
    try {
      setIsInitializing(true);
      await cleanup();

      console.log('Starting new video call session...');
      
      const { data: session, error: sessionError } = await supabase
        .from('tavus_sessions')
        .insert({
          conversation_id: crypto.randomUUID(),
          user_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'active',
          is_active: true,
          session_type: 'video_call',
          participants: [
            { user_id: (await supabase.auth.getUser()).data.user?.id },
            { persona_id: persona.id }
          ]
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      sessionIdRef.current = session.id;

      console.log('Requesting media permissions...');
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

      if (!mountedRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      console.log('Setting up media stream...');
      setStream(mediaStream);
      
      if (localVideoRef.current) {
        console.log('Connecting stream to local video element');
        localVideoRef.current.srcObject = mediaStream;
        await localVideoRef.current.play().catch(error => {
          console.error('Error playing local video:', error);
        });
      }

      setIsCallActive(true);
      onCallStateChange?.(true);
      await startSpeechRecognition();
      
      toast({
        title: "Call Connected",
        description: `You're now in a call with ${persona.name}`,
      });

    } catch (error: any) {
      console.error('Camera/audio initialization error:', error);
      await cleanup();
      
      toast({
        title: "Connection Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        console.log(`Audio track ${track.label} ${track.enabled ? 'enabled' : 'disabled'}`);
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
        console.log(`Video track ${track.label} ${track.enabled ? 'enabled' : 'disabled'}`);
      });
      setIsVideoEnabled(!isVideoEnabled);
      
      toast({
        title: isVideoEnabled ? "Camera Off" : "Camera On",
        description: isVideoEnabled ? "Your camera is now off" : "Your camera is now on",
      });
    }
  };

  const handleCaptureScreenshot = async () => {
    if (!localVideoRef.current || !sessionIdRef.current) return;
    
    try {
      const fileName = await captureAndStoreScreenshot(localVideoRef.current, sessionIdRef.current);
      
      toast({
        title: "Screenshot Captured",
        description: "Screenshot has been saved successfully",
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Error",
        description: "Failed to capture screenshot",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-6xl p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LocalVideo
            onVideoRef={(ref) => { localVideoRef.current = ref; }}
            isRecording={isCallActive}
            currentEmotion={currentEmotion}
            environmentContext={environmentContext}
            isAnalyzing={isAnalyzing}
          />
          <RemoteVideo
            onVideoRef={(ref) => { remoteVideoRef.current = ref; }}
            persona={persona}
            isAnalyzing={isAnalyzing}
          />
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
            onCaptureScreenshot={handleCaptureScreenshot}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;