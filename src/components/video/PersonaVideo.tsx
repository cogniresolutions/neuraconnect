import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface PersonaVideoProps {
  isCallActive: boolean;
  persona: any;
}

export const PersonaVideo: React.FC<PersonaVideoProps> = ({ isCallActive, persona }) => {
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
      {!isCallActive ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={persona.profile_picture_url} alt={persona.name} />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-white">Ready to call {persona.name}</h2>
          </div>
        </div>
      ) : (
        <>
          {persona.profile_picture_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={persona.profile_picture_url}
                alt={persona.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={persona.profile_picture_url} alt={persona.name} />
              <AvatarFallback>{persona.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{persona.name}</span>
          </div>
        </>
      )}
    </div>
  );
};