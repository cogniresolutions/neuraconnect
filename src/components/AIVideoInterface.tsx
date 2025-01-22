import React, { useEffect, useRef, useState } from 'react';
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
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.type === 'response.audio.delta') {
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      onSpeakingChange(false);
    }
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(persona);
      setIsConnected(true);
      
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
    chatRef.current?.disconnect();
    setIsConnected(false);
    onSpeakingChange(false);
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
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
  );
};

export default AIVideoInterface;