import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Loader2, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import VideoAnalysis from './video/VideoAnalysis';

interface AIVideoInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
}

const AIVideoInterface: React.FC<AIVideoInterfaceProps> = ({ 
  persona, 
  onSpeakingChange 
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>({});
  const [chatRef, setChatRef] = useState<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received WebSocket message:', event);
    
    if (event.type === 'response.audio.delta') {
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      onSpeakingChange(false);
    }
  };

  const handleEmotionDetected = async (emotions: any) => {
    setLastAnalysis(emotions);
    
    // Update persona behavior based on emotions
    if (chatRef) {
      const dominantEmotion = Object.entries(emotions)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];
      
      if (dominantEmotion) {
        chatRef.sendMessage(`User appears to be feeling ${dominantEmotion}`);
      }
    }
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      
      const chat = new RealtimeChat(handleMessage);
      await chat.init(persona);
      
      setChatRef(chat);
      setIsConnected(true);
      
      toast({
        title: "Connected",
        description: `${persona.name} is ready to chat`,
      });

    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to start conversation',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = () => {
    chatRef?.disconnect();
    setChatRef(null);
    setIsConnected(false);
    onSpeakingChange(false);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 items-center justify-center">
        {isVideoEnabled && (
          <div className="w-full lg:w-1/2">
            <VideoAnalysis
              personaId={persona.id}
              onEmotionDetected={handleEmotionDetected}
              className="rounded-lg overflow-hidden"
            />
          </div>
        )}
        <div className="w-full lg:w-1/2">
          {persona.profile_picture_url && !persona.avatar_model_url && (
            <img
              src={persona.profile_picture_url}
              alt={persona.name}
              className="w-full h-full object-cover rounded-lg"
            />
          )}
          {persona.avatar_model_url && (
            <video
              src={persona.avatar_model_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
          )}
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <Button
          onClick={toggleVideo}
          variant="secondary"
          disabled={isLoading}
        >
          {isVideoEnabled ? (
            <>
              <VideoOff className="mr-2 h-4 w-4" />
              Disable Camera
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Enable Camera
            </>
          )}
        </Button>
        
        {!isConnected ? (
          <Button 
            onClick={startConversation}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Conversation
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={endConversation}
            variant="secondary"
          >
            <MicOff className="mr-2 h-4 w-4" />
            End Conversation
          </Button>
        )}
      </div>
    </div>
  );
};

export default AIVideoInterface;