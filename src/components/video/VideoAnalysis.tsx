import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface VideoAnalysisProps {
  personaId: string;
  onEmotionDetected?: (emotions: any) => void;
  className?: string;
}

const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
  personaId,
  onEmotionDetected,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const analysisIntervalRef = useRef<NodeJS.Timeout>();

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg');
      });

      const { data, error } = await supabase.functions.invoke('analyze-emotion', {
        body: { 
          imageData: await blobToBase64(blob),
          personaId,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      if (data?.emotions && onEmotionDetected) {
        onEmotionDetected(data.emotions);
      }

    } catch (error) {
      console.error('Error analyzing emotions:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze emotions",
        variant: "destructive",
      });
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    const startVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start analysis after stream is ready
        analysisIntervalRef.current = setInterval(captureAndAnalyze, 5000);
        setIsAnalyzing(true);

      } catch (error) {
        console.error('Error accessing camera:', error);
        toast({
          title: "Camera Error",
          description: "Failed to access camera",
          variant: "destructive",
        });
      }
    };

    startVideoStream();

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full rounded-lg"
      />
      <canvas ref={canvasRef} className="hidden" />
      {isAnalyzing && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs p-2 rounded-full">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default VideoAnalysis;