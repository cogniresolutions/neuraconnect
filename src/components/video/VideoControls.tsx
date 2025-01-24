import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react';

interface VideoControlsProps {
  isCallActive: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isCallActive,
  isAudioEnabled,
  isVideoEnabled,
  onStartCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo
}) => {
  return (
    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg backdrop-blur-sm">
      {isCallActive && (
        <>
          <Button
            onClick={onToggleAudio}
            variant="secondary"
            size="icon"
            className={`${!isAudioEnabled ? 'bg-red-500/50 hover:bg-red-600/50' : 'bg-black/50 hover:bg-black/70'}`}
          >
            {isAudioEnabled ? (
              <Mic className="h-4 w-4 text-white" />
            ) : (
              <MicOff className="h-4 w-4 text-white" />
            )}
          </Button>
          
          <Button
            onClick={onToggleVideo}
            variant="secondary"
            size="icon"
            className={`${!isVideoEnabled ? 'bg-red-500/50 hover:bg-red-600/50' : 'bg-black/50 hover:bg-black/70'}`}
          >
            {isVideoEnabled ? (
              <Video className="h-4 w-4 text-white" />
            ) : (
              <VideoOff className="h-4 w-4 text-white" />
            )}
          </Button>
        </>
      )}
      
      <Button
        onClick={isCallActive ? onEndCall : onStartCall}
        variant={isCallActive ? "destructive" : "default"}
        size="icon"
        className={isCallActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
      >
        {isCallActive ? (
          <PhoneOff className="h-4 w-4" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default VideoControls;