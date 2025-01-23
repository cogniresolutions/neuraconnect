import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";
import Avatar3D from "../Avatar3D";
import { useToast } from "@/hooks/use-toast";

interface PersonaPreviewProps {
  isWebcamActive: boolean;
  toggleWebcam: () => void;
  avatarAnimating: boolean;
}

export const PersonaPreview = ({
  isWebcamActive,
  toggleWebcam,
  avatarAnimating,
}: PersonaPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupWebcam = async () => {
      try {
        if (isWebcamActive) {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (error) {
        console.error('Webcam error:', error);
        toast({
          title: "Camera Error",
          description: error instanceof Error ? error.message : "Failed to access camera",
          variant: "destructive",
        });
      }
    };

    setupWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isWebcamActive, toast]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20">
        {isWebcamActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar3D isAnimating={avatarAnimating} />
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full bg-white/10 text-white border-purple-400/30 hover:bg-white/20"
        onClick={toggleWebcam}
      >
        {isWebcamActive ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" />
            Disable Camera
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Enable Camera
          </>
        )}
      </Button>
    </div>
  );
};