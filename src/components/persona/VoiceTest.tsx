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
    const isFemale = ['Jenny', 'Aria', 'Jane', 'Nancy', 'Sara'].includes(style);
    const gender = isFemale ? 'female' : 'male';
    return `Hi, I'm ${style}, a ${gender} voice assistant`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      console.log('Starting voice test...', { voiceStyle, language });

      // Format the voice name according to Azure's naming convention
      const formattedVoice = `${language}-${voiceStyle}Neural`;
      console.log('Formatted voice name:', formattedVoice);

      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: getVoiceMessage(voiceStyle),
          voice: formattedVoice
        }
      });

      console.log('Azure voice test response:', { data, error });

      if (error) {
        console.error('Azure voice test error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        console.error('No audio content in response');
        throw new Error('No audio content received from Azure');
      }

      console.log('Audio content length:', data.audioContent.length);

      // Create and play audio
      const audio = new Audio();
      
      // Add event listeners for debugging
      audio.addEventListener('loadeddata', () => console.log('Audio loaded'));
      audio.addEventListener('playing', () => console.log('Audio started playing'));
      audio.addEventListener('ended', () => console.log('Audio finished playing'));
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        throw new Error(`Failed to play audio: ${e.type}`);
      });

      // Set the audio source
      audio.src = `data:audio/mp3;base64,${data.audioContent}`;
      
      // Play the audio
      await audio.play();
      
      toast({
        title: "Voice Test",
        description: "Voice sample played successfully",
      });

    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to play voice sample",
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