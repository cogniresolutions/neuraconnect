import React, { useRef, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface VideoOverlayProps {
  personaImage?: string;
  isActive: boolean;
  isAnimating: boolean;
}

const VideoOverlay: React.FC<VideoOverlayProps> = ({ personaImage, isActive, isAnimating }) => {
  if (!isActive) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Avatar 
        className={cn(
          "w-full h-full rounded-lg transition-transform duration-300",
          isAnimating && "animate-subtle-movement"
        )}
      >
        <AvatarImage src={personaImage} className="object-cover" />
        <AvatarFallback>
          <User className="w-12 h-12" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

const VideoChat = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isPersonaActive, setIsPersonaActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  // Fetch active persona from Supabase
  const { data: persona } = useQuery({
    queryKey: ['active-persona'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('status', 'deployed')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    startVideo();
    // Start subtle animation loop
    const animationInterval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }, 5000);

    return () => clearInterval(animationInterval);
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

  const togglePersona = () => {
    if (!persona && !isPersonaActive) {
      toast({
        title: "No Persona Available",
        description: "Please deploy a persona first before activating.",
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
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn(
            "w-full rounded-lg bg-gray-900",
            isPersonaActive && "opacity-0"
          )}
        />
        <VideoOverlay 
          personaImage={persona?.avatar_url} 
          isActive={isPersonaActive}
          isAnimating={isAnimating}
        />
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
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
  );
};

export default VideoChat;