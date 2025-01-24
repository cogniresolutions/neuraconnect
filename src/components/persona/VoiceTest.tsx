import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VOICE_MAPPINGS, LOCALIZED_MESSAGES, type SupportedLanguage } from '@/constants/voices';

interface VoiceTestProps {
  voiceStyle: string;
  language?: string;
}

export const VoiceTest = ({ voiceStyle, language = 'en-US' }: VoiceTestProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const getVoiceName = (style: string, lang: string) => {
    const language = lang as SupportedLanguage;
    if (!VOICE_MAPPINGS[language]) {
      console.warn(`Language ${language} not supported, falling back to en-US`);
      return 'en-US-JennyNeural';
    }

    // Determine if the selected style maps to a male or female voice
    const isFemaleVoice = ['Jenny', 'Aria', 'Nancy', 'Sara', 'Jane'].some(name => 
      style.toLowerCase().includes(name.toLowerCase())
    );

    // Get the appropriate voice list based on gender
    const voiceList = isFemaleVoice ? VOICE_MAPPINGS[language].female : VOICE_MAPPINGS[language].male;
    
    // Select the first voice from the list as default
    const selectedVoice = voiceList[0];
    
    console.log('Selected voice:', `${language}-${selectedVoice}`);
    return `${language}-${selectedVoice}`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      console.log('Starting voice test...', { voiceStyle, language });

      if (!language) {
        throw new Error('Please select a language before testing the voice');
      }

      const formattedVoice = getVoiceName(voiceStyle, language);
      console.log('Using voice:', formattedVoice);

      const message = LOCALIZED_MESSAGES[language as SupportedLanguage] || LOCALIZED_MESSAGES['en-US'];
      console.log('Using message:', message);

      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: message,
          voice: formattedVoice
        }
      });

      if (error) {
        console.error('Azure voice test error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        console.error('No audio content in response');
        throw new Error('No audio content received from Azure');
      }

      // Create and play audio
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
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