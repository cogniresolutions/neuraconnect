import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface VideoHeaderProps {
  personaName: string;
  onBack: () => void;
}

export const VideoHeader: React.FC<VideoHeaderProps> = ({ personaName, onBack }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-black/50 backdrop-blur-sm">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="text-white hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-xl font-semibold text-white">Video Call with {personaName}</h1>
    </div>
  );
};