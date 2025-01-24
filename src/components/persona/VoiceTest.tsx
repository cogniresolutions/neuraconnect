import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceTestProps {
  voiceStyle: string;
  language?: string;
}

export const VoiceTest = ({ voiceStyle, language = 'en' }: VoiceTestProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const getVoiceMessage = (style: string, lang: string) => {
    // Map voice styles to Azure neural voices
    const voiceMap: Record<string, { name: string, gender: string }> = {
      alloy: { name: 'Jenny', gender: 'neutral' },
      echo: { name: 'Guy', gender: 'male' },
      fable: { name: 'Davis', gender: 'male' },
      onyx: { name: 'Tony', gender: 'male' },
      nova: { name: 'Sara', gender: 'female' },
      shimmer: { name: 'Nancy', gender: 'female' }
    };

    const voice = voiceMap[style] || voiceMap.alloy;
    return `Hi, I'm ${voice.name}, a ${voice.gender} voice assistant`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      console.log('Testing voice with Azure Speech Services...');

      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: getVoiceMessage(voiceStyle, language),
          voice: `${language}-${voiceStyle}Neural`,
          language: language
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
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