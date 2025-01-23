import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, PhoneOff } from 'lucide-react';
import Avatar3D from './Avatar3D';

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

  const startCall = async () => {
    try {
      setIsLoading(true);
      console.log('Starting call with persona:', persona);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      // Request media stream before creating the session
      console.log('Requesting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('Media stream obtained:', stream.id);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      console.log('Invoking video-call function...');
      const { data, error } = await supabase.functions.invoke('video-call', {
        body: { 
          personaId: persona.id,
          userId: user.id,
          action: 'start',
          personaConfig: {
            name: persona.name,
            voiceStyle: persona.voice_style,
            modelConfig: persona.model_config
          }
        }
      });

      if (error) {
        console.error('Error from video-call function:', error);
        throw error;
      }

      console.log('Video call function response:', data);

      setIsCallActive(true);
      onCallStateChange(true);
      
      toast({
        title: "Call Started",
        description: `Connected with ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      // Clean up stream if session creation fails
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
      console.log('Ending call...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Invoking video-call end function...');
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
      <div className="grid grid-cols-2 gap-4">
        {isCallActive && (
          <>
            <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
              <Avatar3D
                modelUrl={persona.avatar_model_url}
                isAnimating={true}
                emotions={persona.emotion_settings}
                language={persona.language}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2">
        {!isCallActive ? (
          <Button
            onClick={startCall}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Start Call
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={endCall}
            variant="destructive"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Call
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoCallInterface;