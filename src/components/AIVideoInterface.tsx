import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Loader2, Mic, MicOff } from 'lucide-react';

interface AIVideoInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
}

const AIVideoInterface: React.FC<AIVideoInterfaceProps> = ({ persona, onSpeakingChange }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received WebSocket message:', event);
    
    if (event.type === 'response.audio.delta') {
      console.log('Received audio delta, persona is speaking');
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      console.log('Audio response completed, persona stopped speaking');
      onSpeakingChange(false);
    } else if (event.type === 'error') {
      console.error('WebSocket error:', event.error);
      toast({
        title: "Connection Error",
        description: event.error?.message || "An error occurred during the conversation",
        variant: "destructive",
      });
    }
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing chat with persona:', persona);
      
      // Initialize audio only
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(persona);
      
      setIsConnected(true);
      console.log('WebSocket connection established successfully');
      
      toast({
        title: "Connected",
        description: `${persona.name} is ready to chat`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = () => {
    console.log('Ending conversation and cleaning up connections');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    chatRef.current?.disconnect();
    setIsConnected(false);
    onSpeakingChange(false);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {isConnected && (
          <Button
            onClick={toggleMute}
            variant="secondary"
            size="sm"
            className="bg-black/50 hover:bg-black/70"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-white" />
            )}
          </Button>
        )}
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