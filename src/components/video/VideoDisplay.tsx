import React, { useRef, useEffect } from 'react';

interface VideoDisplayProps {
  stream: MediaStream | null;
  muted?: boolean;
}

const VideoDisplay = ({ stream, muted = false }: VideoDisplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-[640px] h-[480px] rounded-lg overflow-hidden bg-gray-900 shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

export default VideoDisplay;