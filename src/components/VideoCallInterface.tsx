import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { cleanupUserSessions } from '@/utils/sessionCleanup';
import LocalVideo from './video/LocalVideo';
import RemoteVideo from './video/RemoteVideo';
import VideoControls from './video/VideoControls';
import { captureAndStoreScreenshot } from '@/utils/screenshotUtils';
import { analyzeVideoFrame } from '@/utils/videoAnalysis';

interface VideoCallInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
  onCallStateChange?: (isActive: boolean) => void;
  externalVideoUrl?: string;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({ 
  persona, 
  onSpeakingChange,
  onCallStateChange,
  externalVideoUrl 
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
  const [personaStream, setPersonaStream] = useState<MediaStream | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const mountedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);

  const startVideoAnalysis = async () => {
    if (!localVideoRef.current || !isCallActive) return;

    analysisIntervalRef.current = window.setInterval(async () => {
      try {
        setIsAnalyzing(true);
        const canvas = document.createElement('canvas');
        canvas.width = localVideoRef.current!.videoWidth;
        canvas.height = localVideoRef.current!.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        ctx.drawImage(localVideoRef.current!, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const analysisResult = await analyzeVideoFrame(
          imageData,
          persona.id,
          user.id
        );

        if (analysisResult) {
          setCurrentEmotion(analysisResult.emotions?.dominant || '');
          setEnvironmentContext(analysisResult.environment?.description || '');
        }
      } catch (error) {
        console.error('Error during video analysis:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 5000); // Analyze every 5 seconds
  };

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
      
      if (personaStream) {
        personaStream.getTracks().forEach(track => track.stop());
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
      setPersonaStream(null);
      onCallStateChange?.(false);
      
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const initializeAudioContext = async (mediaStream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      
      source.connect(analyser);
      
      const destination = audioContextRef.current.createMediaStreamDestination();
      analyser.connect(destination);
      
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (stream) {
        stream.addTrack(audioTrack);
      }
      
      console.log('Audio context initialized successfully');
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (!mountedRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const isSpeaking = average > 30;
        onSpeakingChange(isSpeaking);
        console.log('Speaking state changed:', isSpeaking);
        
        if (mountedRef.current) {
          requestAnimationFrame(checkAudioLevel);
        }
      };
      
      checkAudioLevel();
      
    } catch (error) {
      console.error('Error initializing audio context:', error);
      throw error;
    }
  };

  const initializeAzureServices = async () => {
    try {
      const response = await fetch('/api/azure-video-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaId: persona.id,
          action: 'initialize',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize Azure services');
      }

      const data = await response.json();
      console.log('Azure services initialized:', data);
      
      return data;
    } catch (error) {
      console.error('Error initializing Azure services:', error);
      throw error;
    }
  };

  const startCall = async () => {
    try {
      setIsInitializing(true);
      console.log('Starting new video call session...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await initializeAzureServices();

      const stream = await navigator.mediaDevices.getUserMedia({
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

      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const { data: session, error } = await supabase.functions.invoke('video-call', {
        body: {
          action: 'start',
          personaId: persona.id,
          userId: user.id,
          personaConfig: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality
          }
        }
      });

      if (error) throw error;

      setIsCallActive(true);
      startVideoAnalysis();

      toast({
        title: "Call Started",
        description: `You're now in a call with ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
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
            onStartCall={startCall}
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
