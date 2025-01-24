import React from 'react';
import { Loader2 } from 'lucide-react';

interface LocalVideoProps {
  onVideoRef: (ref: HTMLVideoElement | null) => void;
  isRecording: boolean;
  currentEmotion?: string;
  environmentContext?: string;
  isAnalyzing?: boolean;
}

const LocalVideo = ({ 
  onVideoRef, 
  isRecording,
  currentEmotion,
  environmentContext,
  isAnalyzing 
}: LocalVideoProps) => {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={onVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]"
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
      {isAnalyzing && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-sm flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Analyzing...
        </div>
      )}
    </div>
  );
};

export default LocalVideo;