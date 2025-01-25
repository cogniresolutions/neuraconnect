import React from 'react';
import { Loader2 } from 'lucide-react';

interface CallStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  errorMessage?: string;
}

export const CallStatus: React.FC<CallStatusProps> = ({ status, errorMessage }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-yellow-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="text-green-500">
            Connected
          </div>
        );
      case 'disconnected':
        return (
          <div className="text-gray-500">
            Disconnected
          </div>
        );
      case 'error':
        return (
          <div className="text-red-500">
            {errorMessage || 'Connection error'}
          </div>
        );
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full">
      {getStatusDisplay()}
    </div>
  );
};