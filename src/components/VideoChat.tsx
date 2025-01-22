import React, { useRef, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff, User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import PersonaSelector from "./PersonaSelector";
import { AIVideoParticipant } from "./AIVideoParticipant";

interface VideoOverlayProps {
  personaImage?: string;
  isActive: boolean;
  isAnimating: boolean;
}

const VideoChat = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isPersonaActive, setIsPersonaActive] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch selected persona from Supabase
  const { data: selectedPersona } = useQuery({
    queryKey: ['selected-persona', selectedPersonaId],
    queryFn: async () => {
      if (!selectedPersonaId) return null;
      
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', selectedPersonaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedPersonaId,
  });

  useEffect(() => {
    startVideo();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isAudioOn,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera or microphone",
        variant: "destructive",
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    startVideo();
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    startVideo();
  };

  const handlePersonaSelect = (personaId: string | null) => {
    setSelectedPersonaId(personaId);
    if (!personaId) {
      setIsPersonaActive(false);
      toast({
        title: "Persona Deactivated",
        description: "Switched to regular video mode",
      });
    }
  };

  const togglePersona = () => {
    if (!selectedPersona && !isPersonaActive) {
      toast({
        title: "No Persona Selected",
        description: "Please select a persona first before activating.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPersonaActive(!isPersonaActive);
    toast({
      title: isPersonaActive ? "Persona Deactivated" : "Persona Activated",
      description: isPersonaActive 
        ? "Switched to regular video mode" 
        : "AI persona overlay is now active",
    });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn(
            "w-full h-full rounded-lg bg-gray-900 object-cover",
            isPersonaActive && "hidden"
          )}
        />
        
        {isPersonaActive && selectedPersonaId && (
          <AIVideoParticipant
            personaId={selectedPersonaId}
            isActive={isPersonaActive}
          />
        )}
      </div>
      
      {/* Persona Controls Section */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col gap-4 w-full max-w-xs bg-black/30 backdrop-blur-sm p-4 rounded-lg">
        <div className="w-full">
          <label className="text-white text-sm mb-2 block">Select Persona</label>
          <PersonaSelector onPersonaSelect={handlePersonaSelect} />
        </div>
        
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVideo}
            className={cn(
              "bg-white/10 backdrop-blur-sm hover:bg-white/20",
              !isVideoOn && "bg-red-500/50 hover:bg-red-500/70"
            )}
          >
            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            className={cn(
              "bg-white/10 backdrop-blur-sm hover:bg-white/20",
              !isAudioOn && "bg-red-500/50 hover:bg-red-500/70"
            )}
          >
            {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={togglePersona}
            className={cn(
              "bg-white/10 backdrop-blur-sm hover:bg-white/20",
              isPersonaActive && "bg-green-500/50 hover:bg-green-500/70"
            )}
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;