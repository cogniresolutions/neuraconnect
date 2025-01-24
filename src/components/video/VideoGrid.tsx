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
    <div className="flex-1 grid grid-cols-2 gap-4 p-4">
      <UserVideo videoRef={videoRef} userName={userName} />
      <PersonaVideo isCallActive={isCallActive} persona={persona} />
    </div>
  );
};