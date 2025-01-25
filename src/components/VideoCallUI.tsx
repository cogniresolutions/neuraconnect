import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Persona {
  id: string;
  name: string;
  description?: string | null;
  voice_style?: string | null;
  profile_picture_url?: string | null;
  video_url?: string | null;
}

interface VideoCallUIProps {
  persona: Persona;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export const VideoCallUI = ({ persona, onCallStart, onCallEnd }: VideoCallUIProps) => {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  const { toast } = useToast();

  const handleStartCall = async () => {
    if (callStatus === 'connecting' || callStatus === 'connected') return;

    try {
      setCallStatus('connecting');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please sign in to start a video call",
        });
        setCallStatus('error');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-conversation', {
        body: {
          persona_id: persona.id,
          user_id: user.id,
        },
      });

      if (error) {
        throw error;
      }

      setCallStatus('connected');
      onCallStart?.();
      
      toast({
        title: "Call Started",
        description: `Starting video call with ${persona.name}`,
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('error');
      toast({
        variant: "destructive",
        title: "Call Error",
        description: error instanceof Error ? error.message : "Failed to start video call",
      });
    }
  };

  const handleEndCall = async () => {
    try {
      setCallStatus('disconnected');
      onCallEnd?.();
      
      toast({
        title: "Call Ended",
        description: "Video call has ended",
      });
      
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end video call properly",
      });
    }
  };

  const isCallActive = callStatus === 'connected';

  return (
    <div className="flex items-center gap-2">
      {!isCallActive ? (
        <Button
          onClick={handleStartCall}
          disabled={callStatus === 'connecting'}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <Phone className="h-4 w-4 mr-2" />
          {callStatus === 'connecting' ? 'Connecting...' : 'Start Call'}
        </Button>
      ) : (
        <Button
          onClick={handleEndCall}
          variant="destructive"
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <PhoneOff className="h-4 w-4 mr-2" />
          End Call
        </Button>
      )}
    </div>
  );
};