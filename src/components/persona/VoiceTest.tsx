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
    const isFemale = ['Jenny', 'Aria', 'Jane', 'Nancy', 'Sara'].some(name => 
      style.toLowerCase().includes(name.toLowerCase())
    );
    const gender = isFemale ? 'female' : 'male';
    return `Hello! I'm your ${gender} AI assistant. My voice style is ${style}. How can I help you today?`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      console.log('Starting voice test...', { voiceStyle, language });

      if (!language) {
        throw new Error('Please select a language before testing the voice');
      }

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
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      // Add event listeners for debugging
      audio.addEventListener('loadeddata', () => console.log('Audio loaded'));
      audio.addEventListener('playing', () => console.log('Audio started playing'));
      audio.addEventListener('ended', () => {
        console.log('Audio finished playing');
        setIsPlaying(false);
      });
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
        throw new Error(`Failed to play audio: ${e.type}`);
      });

      await audio.play();
      
      toast({
        title: "Voice Test",
        description: "Voice sample played successfully",
      });

    } catch (error) {
      console.error('Voice test error:', error);
      setIsPlaying(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to play voice sample",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={testVoice}
      disabled={isPlaying || !language}
      className="ml-2"
      title={!language ? "Please select a language first" : "Test voice"}
    >
      {isPlaying ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};