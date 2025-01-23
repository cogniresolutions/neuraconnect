import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const { toast } = useToast();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  const toggleWebcam = async () => {
    try {
      if (isWebcamActive) {
        // Stop webcam
        const tracks = document.querySelector('video')?.srcObject as MediaStream;
        tracks?.getTracks().forEach(track => track.stop());
        setIsWebcamActive(false);
      } else {
        // Start webcam
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.querySelector('video');
        if (videoElement) {
          videoElement.srcObject = stream;
        }
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error('Webcam error:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera",
        variant: "destructive",
      });
    }
  };

  const toggleMicrophone = async () => {
    try {
      if (isMicActive) {
        // Stop microphone
        const audioTracks = document.querySelector('audio')?.srcObject as MediaStream;
        audioTracks?.getTracks().forEach(track => track.stop());
        setIsMicActive(false);
      } else {
        // Start microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioElement = document.querySelector('audio') || document.createElement('audio');
        audioElement.srcObject = stream;
        setIsMicActive(true);
      }
    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center space-x-4 mb-4">
          <Button
            variant="outline"
            onClick={toggleWebcam}
            className="flex items-center space-x-2"
          >
            {isWebcamActive ? (
              <>
                <CameraOff className="h-4 w-4" />
                <span>Disable Camera</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span>Enable Camera</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={toggleMicrophone}
            className="flex items-center space-x-2"
          >
            {isMicActive ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>Mute Mic</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Enable Mic</span>
              </>
            )}
          </Button>
        </div>

        {isWebcamActive && (
          <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-black max-w-2xl mx-auto">
            <video
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}