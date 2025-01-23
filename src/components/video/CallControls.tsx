import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, PhoneOff } from 'lucide-react';

interface CallControlsProps {
  isCallActive: boolean;
  isLoading: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
}

const CallControls = ({ isCallActive, isLoading, onStartCall, onEndCall }: CallControlsProps) => {
  return (
    <div className="flex gap-4">
      {!isCallActive ? (
        <Button
          onClick={onStartCall}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full h-12 w-12 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Phone className="h-6 w-6" />
          )}
        </Button>
      ) : (
        <Button
          onClick={onEndCall}
          variant="destructive"
          size="lg"
          className="rounded-full h-12 w-12 p-0 hover:bg-red-600"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default CallControls;