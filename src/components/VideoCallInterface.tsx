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

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      setIsCallActive(false);
      setStream(null);
      onCallStateChange?.(false);
      
    } catch (error) {
      console.error('Cleanup error:', error);
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: session, error: sessionError } = await supabase
        .from('tavus_sessions')
        .insert({
          conversation_id: crypto.randomUUID(),
          user_id: user.id,
          status: 'active',
          is_active: true,
          session_type: 'video_call',
          participants: [
            { user_id: user.id },
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

      console.log('Media stream obtained:', mediaStream.id);

      if (!mountedRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      setStream(mediaStream);
      
      if (localVideoRef.current) {
        console.log('Connecting stream to local video element');
        localVideoRef.current.srcObject = mediaStream;
        
        // Explicitly play the video with error handling
        try {
          const playPromise = localVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error playing video:', error);
              toast({
                title: "Video Playback Error",
                description: "Failed to start video playback. Please try again.",
                variant: "destructive",
              });
            });
          }
        } catch (error) {
          console.error('Error starting video playback:', error);
          throw new Error('Failed to start video playback');
        }
      } else {
        console.error('Local video reference not found');
        throw new Error('Video element not initialized');
      }

      setIsCallActive(true);
      onCallStateChange?.(true);
      
      toast({
        title: "Call Connected",
        description: `You're now in a call with ${persona.name}`,
      });

    } catch (error: any) {
      console.error('Camera/audio initialization error:', error);
      await cleanup();
      
      toast({
        title: "Connection Error",
        description: error.message || "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsInitializing(false);
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
            onVideoRef={(ref) => { 
              console.log('Setting local video ref:', ref ? 'ref set' : 'ref null');
              localVideoRef.current = ref; 
            }}
            isRecording={isCallActive}
            currentEmotion={currentEmotion}
            environmentContext={environmentContext}
            isAnalyzing={isAnalyzing}
          />
          <RemoteVideo
            onVideoRef={(ref) => { 
              console.log('Setting remote video ref:', ref ? 'ref set' : 'ref null');
              remoteVideoRef.current = ref; 
            }}
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
            onToggleAudio={() => {
              if (stream) {
                stream.getAudioTracks().forEach(track => {
                  track.enabled = !track.enabled;
                });
                setIsAudioEnabled(!isAudioEnabled);
              }
            }}
            onToggleVideo={() => {
              if (stream) {
                stream.getVideoTracks().forEach(track => {
                  track.enabled = !track.enabled;
                });
                setIsVideoEnabled(!isVideoEnabled);
              }
            }}
            onCaptureScreenshot={handleCaptureScreenshot}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;