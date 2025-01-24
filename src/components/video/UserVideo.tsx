import React from 'react';
import { User } from 'lucide-react';

interface UserVideoProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  userName: string;
}

export const UserVideo: React.FC<UserVideoProps> = ({ videoRef, userName }) => {
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium">{userName || 'You'}</span>
      </div>
    </div>
  );
};