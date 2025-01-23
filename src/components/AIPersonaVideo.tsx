import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!trainingVideoUrl) return;

    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      onReady?.();
    };

    video.addEventListener('canplay', handleCanPlay);
    video.src = trainingVideoUrl;
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [trainingVideoUrl, onReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded || !expressionSegments) return;

    if (isPlaying) {
      const segments = expressionSegments[currentEmotion] || expressionSegments.neutral;
      if (segments && segments.length > 0) {
        const segment = segments[0];
        video.currentTime = segment.start / 1000;
        video.play().catch(error => {
          console.error('Error playing video:', error);
          toast({
            title: "Playback Error",
            description: "Failed to play video segment",
            variant: "destructive",
          });
        });
      }
    } else {
      video.pause();
    }
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