import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoDisplayProps {
  stream: MediaStream | null;
  muted?: boolean;
}

const VideoDisplay = ({ stream, muted = false }: VideoDisplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <div className={`relative rounded-lg overflow-hidden bg-gray-900 shadow-lg transition-all duration-300 ease-in-out
      ${isMaximized ? 'fixed inset-0 z-50' : 'w-full max-w-[640px] aspect-video'}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
        onClick={toggleMaximize}
      >
        {isMaximized ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default VideoDisplay;