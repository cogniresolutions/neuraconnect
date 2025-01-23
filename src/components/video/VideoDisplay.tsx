import React, { useRef, useEffect } from 'react';

interface VideoDisplayProps {
  stream: MediaStream | null;
  className?: string;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({
  stream,
  className = ""
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden bg-black/20 ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};