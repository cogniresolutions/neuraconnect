import { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  AZURE_VOICES, 
  type SupportedLanguage, 
  type VoiceGender,
  getVoicesForLanguage 
} from '@/constants/azureVoices';

interface VoiceSelectorProps {
  language: SupportedLanguage;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

export const VoiceSelector = ({ 
  language, 
  selectedVoice, 
  onVoiceChange 
}: VoiceSelectorProps) => {
  const [gender, setGender] = useState<VoiceGender>('female');
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const { toast } = useToast();
  const voices = getVoicesForLanguage(language, gender);

  const testVoice = async () => {
    try {
      setIsTestingVoice(true);
      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          voice: selectedVoice,
          language: language,
          text: "Hello! This is a test of my voice. How do I sound?"
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
        title: "Voice Test Failed",
        description: "Could not test the voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Voice Gender</Label>
        <Select value={gender} onValueChange={(value: VoiceGender) => setGender(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="male">Male</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Voice Style</Label>
        <div className="flex gap-2">
          <Select value={selectedVoice} onValueChange={onVoiceChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  {voice.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={testVoice}
            disabled={isTestingVoice || !selectedVoice}
          >
            {isTestingVoice ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};