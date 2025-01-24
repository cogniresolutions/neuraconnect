import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

interface VideoCallControlsProps {
  isCallActive: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isLoading: boolean;
  onStartCall: () => Promise<void>;
  onEndCall: () => Promise<void>;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

export const VideoCallControls: React.FC<VideoCallControlsProps> = ({
  isCallActive,
  isAudioEnabled,
  isVideoEnabled,
  isLoading,
  onStartCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo
}) => {
  return (
    <div className="flex items-center justify-center gap-4 bg-black/20 backdrop-blur-sm p-4 rounded-lg">
      {!isCallActive ? (
        <Button
          onClick={onStartCall}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Start Call
            </>
          )}
        </Button>
      ) : (
        <>
          <Button
            onClick={onToggleAudio}
            variant="outline"
            size="icon"
            className={isAudioEnabled ? "bg-transparent" : "bg-red-500/20"}
          >
            {isAudioEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>

          <Button
            onClick={onToggleVideo}
            variant="outline"
            size="icon"
            className={isVideoEnabled ? "bg-transparent" : "bg-red-500/20"}
          >
            {isVideoEnabled ? (
              <Video className="h-4 w-4" />
            ) : (
              <VideoOff className="h-4 w-4" />
            )}
          </Button>

          <Button
            onClick={onEndCall}
            variant="destructive"
            size="icon"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};