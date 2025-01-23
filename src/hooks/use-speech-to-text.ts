import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSpeechToText = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcribe = async (audioData: string): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audioData }
      });

      if (error) throw error;
      if (!data?.text) throw new Error('No transcription received');

      return data.text;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to transcribe audio';
      setError(message);
      console.error('Speech-to-text error:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    transcribe,
    isProcessing,
    error
  };
};