import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VideoDisplayProps {
  stream: MediaStream | null;
  muted?: boolean;
}

const VideoDisplay = ({ stream, muted = false }: VideoDisplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    toast({
      title: !isMaximized ? "Video Maximized" : "Video Minimized",
      description: !isMaximized ? "Video is now in full screen" : "Video returned to normal size",
    });
  };

  return (
    <div 
      className={`
        relative transition-all duration-300 ease-in-out
        ${isMaximized 
          ? 'fixed inset-0 z-50 bg-black' 
          : 'w-full max-w-[640px] aspect-video rounded-lg overflow-hidden bg-gray-900 shadow-lg'
        }
      `}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`
          w-full h-full object-cover
          ${isMaximized ? 'object-contain' : 'object-cover'}
        `}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMaximize}
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full z-50"
      >
        {isMaximized ? (
          <Minimize2 className="h-5 w-5" />
        ) : (
          <Maximize2 className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

export default VideoDisplay;