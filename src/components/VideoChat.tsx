import React, { useRef, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

const VideoChat = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const { toast } = useToast();

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

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg bg-gray-900"
      />
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
      </div>
    </div>
  );
};

export default VideoChat;