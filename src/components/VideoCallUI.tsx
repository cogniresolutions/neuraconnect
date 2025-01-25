import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Persona } from "@/types/persona";

interface VideoCallUIProps {
  persona: Persona;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export const VideoCallUI = ({ persona, onCallStart, onCallEnd }: VideoCallUIProps) => {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  const { toast } = useToast();

  const handleStartCall = async () => {
    if (callStatus === 'connecting' || callStatus === 'connected') {
      console.log('Call already in progress');
      return;
    }

    try {
      console.log('Starting video call...');
      setCallStatus('connecting');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please sign in to start a video call",
        });
        setCallStatus('error');
        return;
      }

      console.log('Creating conversation with persona:', persona.id);
      const { data, error } = await supabase.functions.invoke('create-conversation', {
        body: {
          persona_id: persona.id,
          user_id: user.id,
        },
      });

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }

      console.log('Conversation created successfully:', data);
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
      console.log('Ending video call...');
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
          className={`
            relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 
            hover:from-purple-700 hover:to-indigo-700 text-white font-medium
            px-6 py-2.5 rounded-full shadow-lg transform transition-all duration-200
            hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            ${callStatus === 'connecting' ? 'animate-pulse' : ''}
          `}
        >
          <Phone className="h-4 w-4 mr-2 animate-subtle-movement" />
          {callStatus === 'connecting' ? 'Connecting...' : 'Start Video Call'}
        </Button>
      ) : (
        <Button
          onClick={handleEndCall}
          variant="destructive"
          className={`
            relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600
            hover:from-red-600 hover:to-red-700 text-white font-medium
            px-6 py-2.5 rounded-full shadow-lg transform transition-all duration-200
            hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
          `}
        >
          <PhoneOff className="h-4 w-4 mr-2 animate-subtle-movement" />
          End Call
        </Button>
      )}
    </div>
  );
};