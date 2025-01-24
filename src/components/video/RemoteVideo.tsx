import React, { useRef, useEffect } from 'react';

interface RemoteVideoProps {
  onVideoRef: (ref: HTMLVideoElement | null) => void;
}

const RemoteVideo = ({ onVideoRef }: RemoteVideoProps) => {
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
      className="w-full h-full object-cover rounded-lg"
    />
  );
};

export default RemoteVideo;