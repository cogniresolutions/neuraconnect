import React from 'react';
import { UserVideo } from './UserVideo';
import { PersonaVideo } from './PersonaVideo';

interface VideoGridProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  userName: string;
  isCallActive: boolean;
  persona: any;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videoRef,
  userName,
  isCallActive,
  persona,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 h-full">
      <UserVideo videoRef={videoRef} userName={userName} />
      {isCallActive && <PersonaVideo persona={persona} />}
    </div>
  );
};