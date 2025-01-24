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
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <UserVideo videoRef={videoRef} userName={userName} />
      {isCallActive && <PersonaVideo persona={persona} />}
    </div>
  );
};