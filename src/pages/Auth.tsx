import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/lovable-uploads/e8089c0d-a187-4542-ba87-883bcc8ecd77.png"
              alt="Neuraconnect Logo"
              className="w-24 h-24 object-contain rounded-full shadow-[0_0_20px_rgba(56,182,255,0.4)] transition-transform duration-300 hover:scale-105 border-2 border-[#38b6ff]/30"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Neuraconnect</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

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
          <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-black">
            <video
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Button
            onClick={signInWithGoogle}
            className="w-full"
            variant="outline"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}