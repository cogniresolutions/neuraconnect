import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface VoiceTestProps {
  voiceStyle: string;
  language?: string;
}

interface VoiceMapping {
  language_code: string;
  voice_style: string;
  gender: 'male' | 'female';
  azure_voice_name: string;
  display_name: string;
}

export const VoiceTest = ({ voiceStyle, language = 'en-US' }: VoiceTestProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Fetch the specific voice mapping
  const { data: voiceMapping } = useQuery({
    queryKey: ['voiceMapping', language, voiceStyle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_mappings')
        .select('*')
        .eq('language_code', language)
        .eq('voice_style', voiceStyle)
        .single();
      
      if (error) throw error;
      return data as VoiceMapping;
    },
    enabled: !!language && !!voiceStyle,
  });

  const getLocalizedMessage = (lang: string) => {
    const messages: Record<string, string> = {
      'en-US': "Hello! I'm your AI assistant. How can I help you today?",
      'en-GB': "Hello! I'm your AI assistant. How may I help you today?",
      'es-ES': "¡Hola! Soy tu asistente de IA. ¿Cómo puedo ayudarte hoy?",
      'fr-FR': "Bonjour! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui?",
      'de-DE': "Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
      'it-IT': "Ciao! Sono il tuo assistente IA. Come posso aiutarti oggi?",
      'ja-JP': "こんにちは！AIアシスタントです。今日はどのようにお手伝いできますか？",
      'ko-KR': "안녕하세요! AI 어시스턴트입니다. 오늘 어떻게 도와드릴까요?",
      'zh-CN': "你好！我是你的AI助手。今天我能帮你什么？"
    };
    return messages[lang] || messages['en-US'];
  };

  const testVoice = async () => {
    try {
      setIsPlaying(true);
      console.log('Starting voice test...', { voiceStyle, language, voiceMapping });

      if (!language || !voiceMapping) {
        throw new Error('Please select a language and voice before testing');
      }

      const message = getLocalizedMessage(language);
      console.log('Using message:', message);

      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: message,
          voice: voiceMapping.azure_voice_name,
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
      disabled={isPlaying || !language || !voiceMapping}
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