import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { captureVideoFrame } from '@/utils/videoCapture';

interface VideoAnalysisProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  streamRef: React.RefObject<MediaStream>;
  personaId: string;
  isCallActive: boolean;
  onAnalysisComplete: (analysis: any) => void;
}

export const VideoAnalysis = ({
  videoRef,
  streamRef,
  personaId,
  isCallActive,
  onAnalysisComplete,
}: VideoAnalysisProps) => {
  const { toast } = useToast();
  const analysisIntervalRef = useRef<NodeJS.Timeout>();

  const performAnalysis = async () => {
    if (!videoRef.current || !streamRef.current) return;
    
    try {
      const imageData = captureVideoFrame(videoRef.current);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: analysis, error } = await supabase.functions.invoke('analyze-video', {
        body: { 
          imageData,
          personaId,
          userId: user.id
        }
      });

      if (error) throw error;
      onAnalysisComplete(analysis);

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze video feed",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isCallActive) {
      analysisIntervalRef.current = setInterval(performAnalysis, 1000);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isCallActive]);

  return null;
};