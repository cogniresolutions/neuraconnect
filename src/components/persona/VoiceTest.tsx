import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VOICE_MAPPINGS, LOCALIZED_MESSAGES, type SupportedLanguage } from '@/constants/voices';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceTestProps {
  voiceStyle: string;
  language?: string;
}

export const VoiceTest = ({ voiceStyle, language = 'en-US' }: VoiceTestProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const { toast } = useToast();

  const getVoiceName = (lang: string, gender: 'male' | 'female'): string => {
    const supportedLang = lang as SupportedLanguage;
    if (!VOICE_MAPPINGS[supportedLang]) {
      console.warn(`Language ${lang} not supported, falling back to en-US`);
      return 'en-US-JennyNeural';
    }

    const voices = VOICE_MAPPINGS[supportedLang][gender];
    return `${lang}-${voices[0]}`;
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      console.log('Starting voice test...', { voiceStyle, language, selectedGender });

      if (!language) {
        throw new Error('Please select a language before testing the voice');
      }

      const formattedVoice = getVoiceName(language, selectedGender);
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
    <div className="flex gap-2">
      <Select
        value={selectedGender}
        onValueChange={(value) => setSelectedGender(value as 'male' | 'female')}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>
      
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
    </div>
  );
};