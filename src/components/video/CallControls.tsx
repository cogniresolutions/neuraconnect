import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

interface CallControlsProps {
  isCallActive: boolean;
  isLoading: boolean;
  isMuted: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
}

const CallControls = ({ 
  isCallActive, 
  isLoading, 
  isMuted,
  onStartCall, 
  onEndCall,
  onToggleMute 
}: CallControlsProps) => {
  return (
    <div className="flex gap-4">
      {!isCallActive ? (
        <Button
          onClick={onStartCall}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 mr-2" />
              Video Call
            </>
          )}
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={onToggleMute}
            variant="secondary"
            className="rounded-full h-12 w-12 p-0"
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            onClick={onEndCall}
            variant="destructive"
            className="rounded-full h-12 w-12 p-0 hover:bg-red-600"
            title="End call"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CallControls;