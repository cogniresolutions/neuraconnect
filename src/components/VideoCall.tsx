import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VideoGrid } from './video/VideoGrid';
import { VideoAnalysis } from './video/VideoAnalysis';
import { VideoDisplay } from './video/VideoDisplay';
import { cleanupUserSessions } from '@/utils/sessionCleanup';
import { analyzeVideoFrame } from '@/utils/videoAnalysis';
import { Button } from './ui/button';
import { Loader2, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface VideoCallProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ persona, onSpeakingChange }) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [environmentContext, setEnvironmentContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);

  const startVideoAnalysis = () => {
    if (!videoRef.current || !isCallActive) return;

    analysisIntervalRef.current = window.setInterval(async () => {
      try {
        setIsAnalyzing(true);
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current!.videoWidth;
        canvas.height = videoRef.current!.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        ctx.drawImage(videoRef.current!, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const analysisResult = await analyzeVideoFrame(
          imageData,
          persona.id,
          user.id
        );

        if (analysisResult) {
          setCurrentEmotion(analysisResult.emotions?.dominant || '');
          setEnvironmentContext(analysisResult.environment?.description || '');
        }
      } catch (error) {
        console.error('Error during video analysis:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 5000); // Analyze every 5 seconds
  };

  const stopVideoAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: session, error } = await supabase.functions.invoke('video-call', {
        body: {
          action: 'start',
          personaId: persona.id,
          userId: user.id,
          personaConfig: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality
          }
        }
      });

      if (error) throw error;

      setIsCallActive(true);
      startVideoAnalysis();

      toast({
        title: "Call Started",
        description: `You're now in a call with ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    try {
      stopVideoAnalysis();
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.functions.invoke('video-call', {
          body: {
            action: 'end',
            userId: user.id
          }
        });

        await cleanupUserSessions(user.id);
      }

      setIsCallActive(false);
      setCurrentEmotion('');
      setEnvironmentContext('');

      toast({
        title: "Call Ended",
        description: "The video call has been disconnected",
      });
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        title: "Error",
        description: "Error ending call. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  useEffect(() => {
    // Cleanup on component mount
    const cleanup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await cleanupUserSessions(user.id);
      }
    };
    cleanup();

    // Cleanup on unmount
    return () => {
      stopVideoAnalysis();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      endCall();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-6xl p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VideoDisplay
            videoRef={videoRef}
            isRecording={isCallActive}
            currentEmotion={currentEmotion}
            environmentContext={environmentContext}
            isAnalyzing={isAnalyzing}
          />
          
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {persona.video_url && (
              <video
                src={persona.video_url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            {isAnalyzing && (
              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-sm flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {!isCallActive ? (
            <Button onClick={startCall} className="bg-green-500 hover:bg-green-600">
              <Video className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          ) : (
            <>
              <Button onClick={toggleAudio} variant="outline">
                {isAudioEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4 text-red-500" />
                )}
              </Button>
              <Button onClick={toggleVideo} variant="outline">
                {isVideoEnabled ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4 text-red-500" />
                )}
              </Button>
              <Button onClick={endCall} variant="destructive">
                <VideoOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;