import React from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';

interface VideoControlsProps {
  isCallActive: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onCaptureScreenshot: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isCallActive,
  isAudioEnabled,
  isVideoEnabled,
  onStartCall,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onCaptureScreenshot
}) => {
  return (
    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm p-2 rounded-full">
      {!isCallActive ? (
        <Button 
          onClick={onStartCall} 
          variant="default"
          className="bg-green-500 hover:bg-green-600"
        >
          <Phone className="h-4 w-4 mr-2" />
          Start Call
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
            onClick={onCaptureScreenshot}
            variant="outline"
            size="icon"
            className="bg-transparent"
          >
            <Camera className="h-4 w-4" />
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

export default VideoControls;