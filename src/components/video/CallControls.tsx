import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, PhoneOff, Video, VideoOff, Phone } from "lucide-react";

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
    <div className="flex justify-center items-center gap-3">
      {isRecording ? (
        <Button
          onClick={onStopRecording}
          variant="destructive"
          size="lg"
          className="rounded-full h-12 px-6 transition-all duration-300 hover:scale-105"
        >
          <VideoOff className="mr-2 h-5 w-5" />
          Stop Recording
        </Button>
      ) : (
        <Button
          onClick={onStartRecording}
          variant="secondary"
          size="lg"
          className="rounded-full h-12 px-6 transition-all duration-300 hover:scale-105"
          disabled={!isCallActive}
        >
          <Video className="mr-2 h-5 w-5" />
          Start Recording
        </Button>
      )}
      
      {!isCallActive ? (
        <Button
          onClick={onStartCall}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full h-12 px-8 transition-all duration-300 hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Phone className="mr-2 h-5 w-5" />
              Start Call
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onEndCall}
          variant="destructive"
          size="lg"
          className="rounded-full h-12 px-8 transition-all duration-300 hover:scale-105"
        >
          <PhoneOff className="mr-2 h-5 w-5" />
          End Call
        </Button>
      )}
    </div>
  );
};