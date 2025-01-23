import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';

interface CallControlsProps {
  isCallActive: boolean;
  isLoading: boolean;
  isRecording: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const CallControls = ({
  isCallActive,
  isLoading,
  isRecording,
  onStartCall,
  onEndCall,
  onStartRecording,
  onStopRecording,
}: CallControlsProps) => {
  return (
    <div className="flex gap-2">
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
            onClick={isRecording ? onStopRecording : onStartRecording}
            variant={isRecording ? "destructive" : "default"}
            className="mr-2"
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <Button
            onClick={onEndCall}
            variant="destructive"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Call
          </Button>
        </>
      )}
    </div>
  );
};