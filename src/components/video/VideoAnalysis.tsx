import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { captureVideoFrame } from '@/utils/videoCapture';

interface VideoAnalysisProps {
  personaId: string;
  onAnalysisComplete: (analysis: any) => void;
  onSpeechDetected?: (text: string) => void;
  onEmotionDetected?: (emotions: any) => void;
}

export const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
  personaId,
  onAnalysisComplete,
  onSpeechDetected,
  onEmotionDetected
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [language, setLanguage] = useState<string>('en');

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

        // Initialize speech recognition if onSpeechDetected is provided
        if (onSpeechDetected && 'webkitSpeechRecognition' in window) {
          const recognition = new window.webkitSpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = language;

          recognition.onresult = async (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript;
            
            // Translate text if not in English
            if (language !== 'en') {
              const { data: translatedData, error } = await supabase.functions.invoke('azure-translate', {
                body: { text, targetLanguage: 'en' }
              });
              
              if (!error && translatedData) {
                onSpeechDetected(translatedData.translatedText);
              } else {
                onSpeechDetected(text);
              }
            } else {
              onSpeechDetected(text);
            }
          };

          recognition.start();
        }
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
  }, [toast, onSpeechDetected, language]);

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
        if (onEmotionDetected && analysis.emotions) {
          onEmotionDetected(analysis.emotions);
        }

      } catch (error: any) {
        console.error('Analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 3000); // Analyze every 3 seconds

    return () => clearInterval(analyzeInterval);
  }, [personaId, onAnalysisComplete, onEmotionDetected, isAnalyzing]);

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