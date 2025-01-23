import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VideoDisplay from './video/VideoDisplay';
import CallControls from './video/CallControls';
import AIPersonaVideo from './AIPersonaVideo';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { RealtimeChat } from '@/utils/RealtimeAudio';

interface VideoCallProps {
  onCallStateChange?: (isActive: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallProps> = ({ onCallStateChange }) => {
  const { personaId } = useParams();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [persona, setPersona] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [realtimeChat, setRealtimeChat] = useState<RealtimeChat | null>(null);
  const { toast } = useToast();
  const { speak } = useTextToSpeech();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const loadPersona = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();

      if (error) throw error;
      setPersona(data);
    } catch (error) {
      console.error('Error loading persona:', error);
      toast({
        title: "Error",
        description: "Failed to load persona information. Please try again.",
        variant: "destructive",
      });
    }
  }, [personaId, toast]);

  useEffect(() => {
    if (personaId) {
      loadPersona();
    }
  }, [personaId, loadPersona]);

  const handleRealtimeMessage = useCallback((event: any) => {
    console.log('Received realtime message:', event);
    
    if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done') {
      setIsSpeaking(false);
    }
  }, []);

  const initializeRealtimeChat = async () => {
    try {
      const chat = new RealtimeChat(handleRealtimeMessage);
      await chat.init(persona);
      setRealtimeChat(chat);
      
      // Send initial system message to introduce the persona
      const welcomeMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [
            {
              type: 'text',
              text: `Hello! I'm ${persona?.name || 'your AI Assistant'}. I'm here to help you with your trading questions and provide insights based on my training data.`
            }
          ]
        }
      };
      
      chat.sendMessage(welcomeMessage);
    } catch (error) {
      console.error('Error initializing realtime chat:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initializeRealtimeChat();
        }, RETRY_DELAY);
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to establish realtime connection. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const startCall = async () => {
    try {
      setIsLoading(true);
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsCallActive(true);
      onCallStateChange?.(true);

      // Initialize realtime chat with persona
      await initializeRealtimeChat();

      toast({
        title: `${persona?.name || 'AI Assistant'} joined the call`,
        description: "Connection established successfully",
      });

    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (realtimeChat) {
      realtimeChat.disconnect();
      setRealtimeChat(null);
    }
    setLocalStream(null);
    setIsCallActive(false);
    setIsMuted(false);
    onCallStateChange?.(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      
      toast({
        title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
        description: isMuted ? "Others can now hear you" : "Others cannot hear you",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 items-center justify-center">
        {isCallActive && (
          <>
            <div className="w-full lg:w-1/2">
              <VideoDisplay stream={localStream} muted={true} />
            </div>
            <div className="w-full lg:w-1/2">
              <AIPersonaVideo
                trainingVideoUrl={persona?.avatar_model_url}
                isPlaying={isSpeaking}
                onReady={() => {
                  console.log('AI Persona video ready');
                }}
              />
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4">
        <CallControls
          isCallActive={isCallActive}
          isLoading={isLoading}
          isMuted={isMuted}
          onStartCall={startCall}
          onEndCall={endCall}
          onToggleMute={toggleMute}
        />
      </div>
    </div>
  );
};

export default VideoCallInterface;