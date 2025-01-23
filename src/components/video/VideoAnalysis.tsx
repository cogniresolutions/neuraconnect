import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { captureVideoFrame } from '@/utils/videoCapture';

interface VideoAnalysisProps {
  personaId: string;
  onAnalysisComplete: (analysis: any) => void;
}

export const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
  personaId,
  onAnalysisComplete
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (error: any) {
        console.error('Camera access error:', error);
        toast({
          title: "Camera Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  useEffect(() => {
    const analyzeInterval = setInterval(async () => {
      if (!videoRef.current || !streamRef.current || isAnalyzing) return;

      try {
        setIsAnalyzing(true);
        const imageData = captureVideoFrame(videoRef.current);

        const { data: analysis, error } = await supabase.functions.invoke('analyze-video', {
          body: { 
            imageData,
            personaId,
            userId: (await supabase.auth.getUser()).data.user?.id
          }
        });

        if (error) throw error;
        onAnalysisComplete(analysis);

      } catch (error: any) {
        console.error('Analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 3000); // Analyze every 3 seconds

    return () => clearInterval(analyzeInterval);
  }, [personaId, onAnalysisComplete, isAnalyzing]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover rounded-lg"
    />
  );
};