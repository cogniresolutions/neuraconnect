import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Volume2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AZURE_VOICES, 
  LOCALIZED_TEST_MESSAGES,
  type SupportedLanguage,
  type VoiceGender 
} from '@/constants/azureVoices';

export default function AzureVoiceTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en-US');
  const [selectedGender, setSelectedGender] = useState<VoiceGender>('female');
  const { toast } = useToast();

  const getSelectedVoice = () => {
    const voices = AZURE_VOICES[selectedLanguage];
    return voices.find(v => v.gender === selectedGender)?.name || voices[0].name;
  };

  const testAzureVoice = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Azure voice test...');
      const voiceName = getSelectedVoice();
      console.log('Selected voice:', voiceName);

      const { data, error } = await supabase.functions.invoke('azure-voice-test', {
        body: { 
          text: LOCALIZED_TEST_MESSAGES[selectedLanguage],
          voice: voiceName,
          language: selectedLanguage
        }
      });

      console.log('Edge Function Response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
        setAudioUrl(`data:audio/mp3;base64,${data.audioContent}`);
        
        toast({
          title: 'Success',
          description: 'Azure Speech Services test completed successfully',
        });
      }
    } catch (error) {
      console.error('Error testing Azure voice:', error);
      toast({
        title: 'Error',
        description: 'Failed to test Azure voice: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-black/95 text-white rounded-lg">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Azure Voice Test</h2>
        <p className="text-sm text-gray-400">
          Select a language and voice style to test Azure Speech Services.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}
            >
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AZURE_VOICES).map(([code, voices]) => (
                  <SelectItem key={code} value={code}>
                    {voices[0].locale} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Gender</label>
            <Select
              value={selectedGender}
              onValueChange={(value) => setSelectedGender(value as VoiceGender)}
            >
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue placeholder="Select voice gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={testAzureVoice}
          variant="outline"
          className="bg-white/10 text-white hover:bg-white/20 w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Volume2 className="mr-2 h-4 w-4" />
              Test Azure Voice
            </>
          )}
        </Button>
      </div>
      
      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}