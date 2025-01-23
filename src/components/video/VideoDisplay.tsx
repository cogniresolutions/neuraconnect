import React from 'react';
import AIPersonaVideo from '../AIPersonaVideo';

interface VideoDisplayProps {
  videoRef: React.RefRef<HTMLVideoElement>;
  isRecording: boolean;
  currentEmotion: string;
  trainingVideo: any;
  isCallActive: boolean;
}

export const VideoDisplay = ({
  videoRef,
  isRecording,
  currentEmotion,
  trainingVideo,
  isCallActive,
}: VideoDisplayProps) => {
  if (!isCallActive) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {isRecording && (
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500 px-2 py-1 rounded-full text-white text-xs">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Recording
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
          Emotion: {currentEmotion}
        </div>
      </div>
      <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
        {trainingVideo ? (
          <AIPersonaVideo
            trainingVideoUrl={trainingVideo.video_url}
            expressionSegments={trainingVideo.expression_segments}
            currentEmotion={currentEmotion}
            isPlaying={isCallActive}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            No training video available
          </div>
        )}
      </div>
    </div>
  );
};