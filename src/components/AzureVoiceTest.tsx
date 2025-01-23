import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AzureVoiceTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const testAzureVoice = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Azure voice test...');
      const { data, error } = await supabase.functions.invoke('azure-voice-test');

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
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Azure Voice Test</h2>
        <p className="text-sm text-gray-400">
          Click the button below to test Azure Speech Services connectivity.
        </p>
        <Button 
          onClick={testAzureVoice}
          variant="outline"
          className="bg-white/10 text-white hover:bg-white/20"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Azure Voice'
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