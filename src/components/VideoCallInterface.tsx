import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { cleanupUserSessions } from '@/utils/sessionCleanup';
import LocalVideo from './video/LocalVideo';
import RemoteVideo from './video/RemoteVideo';
import VideoControls from './video/VideoControls';
import { captureAndStoreScreenshot } from '@/utils/screenshotUtils';
import { captureVideoFrame } from '@/utils/videoCapture';
import { analyzeVideoFrame } from '@/utils/videoAnalysis';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const mountedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

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

  const startSpeechRecognition = async () => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }

        if (mediaRecorder.state === 'inactive') {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const reader = new FileReader();
          
          reader.onload = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const { data, error } = await supabase.functions.invoke('azure-speech', {
              body: { mode: 'stt', audio: base64Audio }
            });

            if (error) {
              console.error('Speech recognition error:', error);
              return;
            }

            if (data?.text) {
              // Send transcribed text to chat
              chatRef.current?.sendMessage(data.text);
            }
          };

          reader.readAsDataURL(audioBlob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Capture in 1-second intervals
      setIsSpeechRecognitionActive(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Error",
        description: "Failed to start speech recognition",
        variant: "destructive",
      });
    }
  };

  const stopSpeechRecognition = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsSpeechRecognitionActive(false);
  };

  // Cleanup function
  const cleanup = useCallback(async () => {
    console.log('Running cleanup in VideoCallInterface');
    try {
      // Stop all media tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }

      // Close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Disconnect chat
      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Update session status if we have a session ID
      if (sessionIdRef.current) {
        const { error } = await supabase
          .from('tavus_sessions')
          .update({ 
            status: 'ended',
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionIdRef.current);

        if (error) {
          console.error('Error updating session status:', error);
        }
      }

      // Clean up any hanging sessions
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await cleanupUserSessions(user?.id);
      }

      setStream(null);
      setIsCallActive(false);
      onCallStateChange?.(false);
      sessionIdRef.current = null;

    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to completely clean up the call. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [stream, onCallStateChange, toast]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    // Clean up any hanging sessions on mount
    const initialCleanup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await cleanupUserSessions(user.id);
      }
    };
    initialCleanup();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, cleaning up sessions...');
        await cleanup();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [cleanup]);

  const startCamera = async () => {
    if (isInitializing) return;
    
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

      chatRef.current = new RealtimeChat((event) => {
        if (event.type === 'response.audio.delta') {
          onSpeakingChange(true);
        } else if (event.type === 'response.audio.done') {
          onSpeakingChange(false);
        } else if (event.type === 'response.text') {
          // Convert response text to speech
          supabase.functions.invoke('azure-speech', {
            body: {
              mode: 'tts',
              text: event.content,
              voice: persona.voice_style
            }
          }).then(({ data, error }) => {
            if (error) {
              console.error('Text-to-speech error:', error);
              return;
            }

            if (data?.audio) {
              const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
              audio.play();
            }
          });
        }
      });

      await chatRef.current.init(persona);

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

      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
        await localVideoRef.current.play();
      }

      audioContextRef.current = new AudioContext();
      
      setIsCallActive(true);
      onCallStateChange?.(true);
      startSpeechRecognition();
      
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-6xl p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LocalVideo
            videoRef={localVideoRef}
            isRecording={isCallActive}
            currentEmotion={currentEmotion}
            environmentContext={environmentContext}
            isAnalyzing={isAnalyzing}
          />
          <RemoteVideo
            videoRef={remoteVideoRef}
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
