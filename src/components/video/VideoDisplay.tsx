import React from 'react';

interface VideoDisplayProps {
  stream?: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  currentEmotion: string;
  environmentContext?: string;
  isAnalyzing: boolean;
  trainingVideo?: any;
  isCallActive?: boolean;
  className?: string;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({
  stream,
  videoRef,
  isRecording,
  currentEmotion,
  environmentContext,
  isAnalyzing,
  trainingVideo,
  isCallActive,
  className = ""
}) => {
  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden bg-black/20 ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {currentEmotion && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
          Emotion: {currentEmotion}
        </div>
      )}
      {environmentContext && (
        <div className="absolute top-12 left-2 bg-black/50 text-white text-xs p-2 rounded">
          Environment: {environmentContext}
        </div>
      )}
      {isRecording && (
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500/50 text-white text-xs p-2 rounded">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording
        </div>
      )}
    </div>
  );
};