import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, PhoneOff } from "lucide-react";

interface CallControlsProps {
  isCallActive: boolean;
  isLoading: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isCallActive,
  isLoading,
  onStartCall,
  onEndCall
}) => {
  return (
    <div className="flex justify-center gap-2">
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