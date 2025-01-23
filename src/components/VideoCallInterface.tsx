import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, PhoneOff } from 'lucide-react';
import { RealtimeChat } from '@/utils/RealtimeAudio';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);

  const startCall = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing call with persona:', persona);
      
      // Initialize video stream first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
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
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
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
      {isCallActive && (
        <div className="relative w-80 h-60 rounded-lg overflow-hidden bg-gray-900 shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
              className="rounded-full h-12 w-12 p-0 hover:bg-red-600"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
      
      {!isCallActive && (
        <Button
          onClick={startCall}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full h-12 w-12 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Phone className="h-6 w-6" />
          )}
        </Button>
      )}
    </div>
  );
};

export default VideoCallInterface;