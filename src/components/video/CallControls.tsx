import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, PhoneOff, Video, VideoOff } from "lucide-react";

interface CallControlsProps {
  isCallActive: boolean;
  isLoading: boolean;
  isRecording: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isCallActive,
  isLoading,
  isRecording,
  onStartCall,
  onEndCall,
  onStartRecording,
  onStopRecording
}) => {
  return (
    <div className="flex justify-center gap-2">
      {isRecording ? (
        <Button
          onClick={onStopRecording}
          variant="destructive"
          size="sm"
        >
          <VideoOff className="mr-2 h-4 w-4" />
          Stop Recording
        </Button>
      ) : (
        <Button
          onClick={onStartRecording}
          variant="secondary"
          size="sm"
          disabled={!isCallActive}
        >
          <Video className="mr-2 h-4 w-4" />
          Start Recording
        </Button>
      )}
      
      {!isCallActive ? (
        <Button
          onClick={onStartCall}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Start Call"
          )}
        </Button>
      ) : (
        <Button
          onClick={onEndCall}
          variant="destructive"
        >
          <PhoneOff className="mr-2 h-4 w-4" />
          End Call
        </Button>
      )}
    </div>
  );
};