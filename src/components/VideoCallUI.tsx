import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, PhoneOff, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoCallUIProps {
  persona: {
    id: string;
    name: string;
    profile_picture_url?: string | null;
  };
}

const VideoCallUI: React.FC<VideoCallUIProps> = ({ persona }) => {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'live' | 'disconnected'>('idle');
  const { toast } = useToast();

  const startCall = async () => {
    try {
      setCallStatus('connecting');
      
      const { data, error } = await supabase.functions.invoke('create-conversation', {
        body: {
          persona_id: persona.id,
          conversation_name: `Call with ${persona.name}`,
          context: 'video_call'
        }
      });

      if (error) throw error;

      setCallStatus('live');
      
      toast({
        title: "Call Started",
        description: "You're now connected to the video call",
      });

    } catch (error: any) {
      console.error('Error starting call:', error);
      setCallStatus('disconnected');
      
      toast({
        title: "Call Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    try {
      setCallStatus('disconnected');
      
      toast({
        title: "Call Ended",
        description: "The video call has been disconnected",
      });
    } catch (error: any) {
      console.error('Error ending call:', error);
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="overflow-hidden">
        <div className="aspect-video relative bg-gray-900 rounded-t-lg">
          {persona.profile_picture_url ? (
            <img
              src={persona.profile_picture_url}
              alt={persona.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
              <Video className="w-16 h-16 text-white/50" />
            </div>
          )}
          
          <div className="absolute top-4 right-4">
            <Badge 
              variant={callStatus === 'live' ? "default" : "secondary"}
              className={`${
                callStatus === 'live' 
                  ? 'bg-green-500' 
                  : callStatus === 'connecting' 
                  ? 'bg-yellow-500' 
                  : 'bg-gray-500'
              } text-white`}
            >
              {callStatus === 'connecting' && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              )}
              {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
            </Badge>
          </div>
        </div>
        
        <div className="p-4 flex justify-center gap-4">
          {callStatus === 'idle' || callStatus === 'disconnected' ? (
            <Button
              onClick={startCall}
              className="bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          ) : (
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End Call
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VideoCallUI;