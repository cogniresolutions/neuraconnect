import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AIPersonaVideoProps {
  trainingVideoUrl?: string;
  expressionSegments?: {
    [key: string]: Array<{ start: number; end: number; }>;
  };
  currentEmotion?: string;
  isPlaying?: boolean;
  onReady?: () => void;
}

const AIPersonaVideo: React.FC<AIPersonaVideoProps> = ({
  trainingVideoUrl,
  expressionSegments,
  currentEmotion = 'neutral',
  isPlaying = false,
  onReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const loadVideo = useCallback(async () => {
    if (!trainingVideoUrl) return;

    const video = videoRef.current;
    if (!video) return;

    try {
      video.src = trainingVideoUrl;
      await video.load();
      
      // Set video properties for better performance
      video.playsInline = true;
      video.preload = "auto";
      video.muted = true;

      // Enable hardware acceleration when available
      video.style.transform = 'translateZ(0)';
      
      setIsLoaded(true);
      onReady?.();
    } catch (error) {
      console.error('Error loading video:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadVideo();
        }, 2000);
      } else {
        toast({
          title: "Video Error",
          description: "Failed to load persona video. Please try refreshing.",
          variant: "destructive",
        });
      }
    }
  }, [trainingVideoUrl, onReady, retryCount, toast]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded || !expressionSegments) return;

    const playSegment = async () => {
      if (isPlaying) {
        const segments = expressionSegments[currentEmotion] || expressionSegments.neutral;
        if (segments && segments.length > 0) {
          const segment = segments[0];
          video.currentTime = segment.start / 1000;
          
          try {
            await video.play();
          } catch (error) {
            console.error('Error playing video:', error);
            toast({
              title: "Playback Error",
              description: "Failed to play video segment",
              variant: "destructive",
            });
          }
        }
      } else {
        video.pause();
      }
    };

    playSegment();
  }, [isPlaying, currentEmotion, expressionSegments, isLoaded, toast]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg"
        playsInline
        muted
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      )}
    </div>
  );
};

export default AIPersonaVideo;