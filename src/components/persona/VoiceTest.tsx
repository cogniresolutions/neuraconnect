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
    const messages: Record<string, Record<string, string>> = {
      en: {
        alloy: "Hi, I am Alloy, a neutral voice assistant",
        echo: "Hello there, I'm Echo, a male voice assistant",
        fable: "Greetings, I'm Fable, your male voice companion",
        onyx: "Hi, I'm Onyx, a male voice assistant",
        nova: "Hello, I'm Nova, a female voice assistant",
        shimmer: "Hi there, I'm Shimmer, a female voice assistant"
      },
      es: {
        alloy: "Hola, soy Alloy, un asistente de voz neutral",
        echo: "Hola, soy Echo, un asistente de voz masculino",
        fable: "Saludos, soy Fable, tu compañero de voz masculino",
        onyx: "Hola, soy Onyx, un asistente de voz masculino",
        nova: "Hola, soy Nova, una asistente de voz femenina",
        shimmer: "Hola, soy Shimmer, una asistente de voz femenina"
      },
      // Add more languages as needed
    };
    
    return messages[lang]?.[style] || messages.en[style] || `Hello, I'm ${style}`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: getVoiceMessage(voiceStyle, language),
          voice: voiceStyle,
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