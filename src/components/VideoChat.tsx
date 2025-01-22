import React, { useRef, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff, User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import PersonaSelector from "./PersonaSelector";

interface VideoOverlayProps {
  personaImage?: string;
  isActive: boolean;
  isAnimating: boolean;
}

interface AnalysisResult {
  objects?: { object: string }[];
  scenes?: { scenery: string }[];
  tags?: { name: string }[];
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
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
    // Start subtle animation loop
    const animationInterval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }, 5000);

    return () => clearInterval(animationInterval);
  }, []);

  useEffect(() => {
    let analysisInterval: NodeJS.Timeout;

    if (isAnalyzing && videoRef.current) {
      analysisInterval = setInterval(async () => {
        await captureAndAnalyze();
      }, 1000); // Analyze every second
    }

    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
    };
  }, [isAnalyzing]);

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

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: { imageData }
      });

      if (error) throw error;

      setAnalysisResults(prev => [...prev.slice(-4), data]); // Keep last 5 results
      
      // Log analysis for debugging
      console.log('Scene Analysis:', data);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze video frame",
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

  const toggleAnalysis = () => {
    setIsAnalyzing(!isAnalyzing);
    toast({
      title: isAnalyzing ? "Analysis Stopped" : "Analysis Started",
      description: isAnalyzing 
        ? "Video analysis has been stopped" 
        : "Analyzing video feed every second",
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
          personaImage={selectedPersona?.avatar_url} 
          isActive={isPersonaActive}
          isAnimating={isAnimating}
        />
        {analysisResults.length > 0 && (
          <div className="absolute top-2 left-2 right-2 bg-black/50 p-2 rounded text-white text-sm">
            {analysisResults[analysisResults.length - 1]?.scenes?.[0]?.scenery && (
              <p>Scene: {analysisResults[analysisResults.length - 1].scenes[0].scenery}</p>
            )}
            {analysisResults[analysisResults.length - 1]?.objects?.slice(0, 3).map((obj, i) => (
              <span key={i} className="mr-2">
                {obj.object}
              </span>
            ))}
          </div>
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
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAnalysis}
            className={cn(
              "bg-white/10 backdrop-blur-sm hover:bg-white/20",
              isAnalyzing && "bg-green-500/50 hover:bg-green-500/70"
            )}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;