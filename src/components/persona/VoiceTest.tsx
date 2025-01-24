import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceTestProps {
  voiceStyle: string;
  language?: string;
}

export const VoiceTest = ({ voiceStyle, language = 'en-US' }: VoiceTestProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const getVoiceMessage = (style: string) => {
    // Get gender from voice style name
    const isFemale = ['Jenny', 'Aria', 'Jane', 'Nancy', 'Sara'].includes(style);
    const gender = isFemale ? 'female' : 'male';
    return `Hi, I'm ${style}, a ${gender} voice assistant`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      console.log('Testing voice with Azure Speech Services...', { voiceStyle, language });

      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: getVoiceMessage(voiceStyle),
          voice: `${language}-${voiceStyle}Neural`,
          language: language
        }
      });

      console.log('Azure voice test response:', { data, error });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
        
        toast({
          title: "Voice Test",
          description: "Voice sample played successfully",
        });
      } else {
        throw new Error('No audio content received');
      }
    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Error",
        description: "Failed to play voice sample",
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