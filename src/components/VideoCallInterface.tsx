import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import VideoDisplay from './video/VideoDisplay';
import CallControls from './video/CallControls';

interface VideoCallInterfaceProps {
  persona: any;
  onCallStateChange: (isActive: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  persona,
  onCallStateChange
}) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);

  const startCall = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing call with persona:', persona);
      
      // Initialize video stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      streamRef.current = stream;

      // Initialize real-time chat with OpenAI
      chatRef.current = new RealtimeChat((event) => {
        console.log('Received WebSocket message:', event);
        
        if (event.type === 'response.audio.delta') {
          console.log('Received audio delta, persona is speaking');
          onCallStateChange(true);
        } else if (event.type === 'response.audio.done') {
          console.log('Audio response completed, persona stopped speaking');
          onCallStateChange(false);
        } else if (event.type === 'error') {
          console.error('WebSocket error:', event.error);
          toast({
            title: "Connection Error",
            description: event.error?.message || "An error occurred during the call",
            variant: "destructive",
          });
        }
      });
      
      await chatRef.current.init(persona);

      // Create Supabase session record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          personaId: persona.id,
          userId: user.id,
          action: 'start'
        }
      });

      if (error) throw error;

      setIsCallActive(true);
      onCallStateChange(true);
      
      toast({
        title: "Call Started",
        description: `Connected with ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      toast({
        title: "Call Error",
        description: error.message || "Failed to start call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          personaId: persona.id,
          userId: user.id,
          action: 'end'
        }
      });

      if (error) throw error;

      setIsCallActive(false);
      onCallStateChange(false);
      
      toast({
        title: "Call Ended",
        description: `Disconnected from ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error ending call:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to end call",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {isCallActive && <VideoDisplay stream={streamRef.current} muted />}
      <CallControls
        isCallActive={isCallActive}
        isLoading={isLoading}
        onStartCall={startCall}
        onEndCall={endCall}
      />
    </div>
  );
};

export default VideoCallInterface;