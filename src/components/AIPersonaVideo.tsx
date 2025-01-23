import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AIPersonaVideoProps {
  videoUrl?: string;
  onVideoLoad?: () => void;
  className?: string;
}

const AIPersonaVideo: React.FC<AIPersonaVideoProps> = ({
  videoUrl,
  onVideoLoad,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setError('No video URL provided');
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      console.log('Video can play');
      setIsVideoReady(true);
      setIsLoading(false);
      if (onVideoLoad) onVideoLoad();
    };

    const handleError = (e: Event) => {
      console.error('Video loading error:', e);
      setError('Failed to load video');
      setIsLoading(false);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    // Load the video
    video.src = videoUrl;
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl, onVideoLoad]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && !isVideoReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <video
        ref={videoRef}
        className={`h-full w-full ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        playsInline
        muted
        loop
      />
    </div>
  );
};

export default AIPersonaVideo;