import React from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface RemoteVideoProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  persona: any;
  isAnalyzing?: boolean;
}

const RemoteVideo = ({ videoRef, persona, isAnalyzing }: RemoteVideoProps) => {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
        <Avatar className="h-6 w-6">
          <AvatarImage src={persona.profile_picture_url} alt={persona.name} />
          <AvatarFallback>{persona.name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{persona.name}</span>
      </div>
      {isAnalyzing && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-sm flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  );
};

export default RemoteVideo;