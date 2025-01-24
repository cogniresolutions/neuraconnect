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

    // Map the voice style to the corresponding Azure voice name and gender
    const voiceMap: Record<string, { gender: 'male' | 'female', baseName: string }> = {
      'Jenny': { gender: 'female', baseName: 'Jenny' },
      'Guy': { gender: 'male', baseName: 'Guy' },
      'Aria': { gender: 'female', baseName: 'Aria' },
      'Davis': { gender: 'male', baseName: 'Davis' },
      'Jane': { gender: 'female', baseName: 'Jane' },
      'Jason': { gender: 'male', baseName: 'Jason' },
      'Nancy': { gender: 'female', baseName: 'Nancy' },
      'Tony': { gender: 'male', baseName: 'Tony' },
      'Sara': { gender: 'female', baseName: 'Sara' },
      'Brandon': { gender: 'male', baseName: 'Brandon' }
    };

    const voiceInfo = voiceMap[style];
    if (!voiceInfo) {
      console.warn(`Voice style ${style} not found, using default female voice`);
      return `${language}-${VOICE_MAPPINGS[language].female[0]}`;
    }

    // Get the voice list for the selected gender
    const voiceList = voiceInfo.gender === 'female' 
      ? VOICE_MAPPINGS[language].female 
      : VOICE_MAPPINGS[language].male;

    // Try to find a similar sounding voice in the target language
    let selectedVoice = voiceList[0]; // Default to first voice as fallback
    
    // Look for voices with similar characteristics
    if (voiceInfo.gender === 'female') {
      // For female voices, try to match soft/warm voices with similar ones
      if (['Jenny', 'Aria', 'Sara'].includes(style)) {
        selectedVoice = voiceList.find(v => 
          v.toLowerCase().includes('warm') || 
          v.toLowerCase().includes('young') || 
          v.toLowerCase().includes('friendly')
        ) || voiceList[0];
      } else {
        // For more professional voices like Nancy
        selectedVoice = voiceList.find(v => 
          v.toLowerCase().includes('professional') || 
          v.toLowerCase().includes('clear')
        ) || voiceList[0];
      }
    } else {
      // For male voices, try to match based on age/style
      if (['Guy', 'Jason'].includes(style)) {
        selectedVoice = voiceList.find(v => 
          v.toLowerCase().includes('casual') || 
          v.toLowerCase().includes('friendly')
        ) || voiceList[0];
      } else {
        // For more formal voices like Davis
        selectedVoice = voiceList.find(v => 
          v.toLowerCase().includes('formal') || 
          v.toLowerCase().includes('professional')
        ) || voiceList[0];
      }
    }

    console.log('Voice selection:', {
      style,
      gender: voiceInfo.gender,
      language,
      availableVoices: voiceList,
      selectedVoice: `${language}-${selectedVoice}`
    });

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
          voice: formattedVoice,
          language: language
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
