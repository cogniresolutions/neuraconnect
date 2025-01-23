import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceTestProps {
  voiceStyle: string;
}

export const VoiceTest = ({ voiceStyle }: VoiceTestProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const getVoiceMessage = (style: string) => {
    const voices: Record<string, string> = {
      alloy: "Hi, I am Alloy, a neutral voice assistant",
      echo: "Hello there, I'm Echo, a male voice assistant",
      fable: "Greetings, I'm Fable, your male voice companion",
      onyx: "Hi, I'm Onyx, a male voice assistant",
      nova: "Hello, I'm Nova, a female voice assistant",
      shimmer: "Hi there, I'm Shimmer, a female voice assistant"
    };
    return voices[style] || `Hello, I'm ${style}`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: getVoiceMessage(voiceStyle),
          voice: voiceStyle
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
        
        toast({
          title: "Voice Test",
          description: `Testing ${voiceStyle} voice`,
        });
      }
    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Error",
        description: "Failed to test voice",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={testVoice}
      disabled={isPlaying}
      className="ml-2"
    >
      {isPlaying ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};