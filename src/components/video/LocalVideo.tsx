import React, { useRef, useEffect } from 'react';

interface LocalVideoProps {
  onVideoRef: (ref: HTMLVideoElement | null) => void;
}

const LocalVideo = ({ onVideoRef }: LocalVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      onVideoRef(videoRef.current);
    }
    return () => onVideoRef(null);
  }, [onVideoRef]);

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

export default LocalVideo;