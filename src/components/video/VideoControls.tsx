import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Phone, Record, StopCircle } from 'lucide-react';

interface VideoControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isRecording: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleRecording: () => void;
  onEndCall: () => void;
}

const VideoControls = ({
  isAudioEnabled,
  isVideoEnabled,
  isRecording,
  onToggleAudio,
  onToggleVideo,
  onToggleRecording,
  onEndCall,
}: VideoControlsProps) => {
  return (
    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg backdrop-blur-sm">
      <Button
        onClick={onToggleAudio}
        variant="secondary"
        size="icon"
        className="bg-black/50 hover:bg-black/70"
      >
        {isAudioEnabled ? (
          <Mic className="h-4 w-4 text-white" />
        ) : (
          <MicOff className="h-4 w-4 text-red-500" />
        )}
      </Button>

      <Button
        onClick={onToggleVideo}
        variant="secondary"
        size="icon"
        className="bg-black/50 hover:bg-black/70"
      >
        {isVideoEnabled ? (
          <Video className="h-4 w-4 text-white" />
        ) : (
          <VideoOff className="h-4 w-4 text-red-500" />
        )}
      </Button>

      <Button
        onClick={onToggleRecording}
        variant="secondary"
        size="icon"
        className="bg-black/50 hover:bg-black/70"
      >
        {isRecording ? (
          <StopCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Record className="h-4 w-4 text-white" />
        )}
      </Button>

      <Button
        onClick={onEndCall}
        variant="destructive"
        size="icon"
        className="bg-red-500 hover:bg-red-600"
      >
        <Phone className="h-4 w-4 rotate-135" />
      </Button>
    </div>
  );
};

export default VideoControls;