import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoDisplay } from "./video/VideoDisplay";
import { VideoAnalysis } from "./video/VideoAnalysis";
import { CallControls } from "./video/CallControls";
import { VideoGrid } from "./video/VideoGrid";

interface VideoCallInterfaceProps {
  persona: any;
  onCallStateChange: (isActive: boolean) => void;
  isVideoMode?: boolean;
}

const AZURE_CONTAINER_VIDEO_URL = "https://persona--zw6su7w.graygrass-5ab083e6.eastus.azurecontainerapps.io/video";

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  persona,
  onCallStateChange,
  isVideoMode = true,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const azureVideoRef = useRef<HTMLVideoElement | null>(null);

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      setStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (azureVideoRef.current) {
      azureVideoRef.current.pause();
      azureVideoRef.current.src = '';
    }
  };

  // Effect to cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const startCamera = async () => {
    console.log('Starting camera...');
    try {
      cleanup();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (!mediaStream) {
        throw new Error('Failed to get media stream');
      }

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;

      // Start Azure Container video stream
      if (azureVideoRef.current) {
        azureVideoRef.current.src = AZURE_CONTAINER_VIDEO_URL;
        try {
          await azureVideoRef.current.play();
          console.log('Azure video stream started');
        } catch (error) {
          console.error('Error playing Azure video:', error);
        }
      }
      
      try {
        await videoRef.current.play();
        console.log('Video playback started');
        return true;
      } catch (playError) {
        console.error('Error playing video:', playError);
        cleanup();
        throw new Error('Failed to start video playback');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      cleanup();
      toast({
        title: "Error",
        description: "Could not access camera or microphone. Please make sure they are connected and permissions are granted.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleStartCall = async () => {
    if (isLoading) return;
    
    console.log('Starting call...');
    setIsLoading(true);
    
    try {
      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        throw new Error('Failed to start camera');
      }

      const { data: conversationData, error: conversationError } = await supabase.functions.invoke('create-conversation', {
        body: {
          persona_id: persona.id,
          conversation_name: `Call with ${persona.name}`,
          context: 'video_call'
        }
      });

      if (conversationError) throw conversationError;
      console.log('Conversation created:', conversationData);

      setIsCallActive(true);
      onCallStateChange(true);
      
      toast({
        title: "Call Started",
        description: "You're now connected to the video call",
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      cleanup();
      setIsCallActive(false);
      onCallStateChange(false);
      
      toast({
        title: "Error",
        description: error.message || "Failed to start call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechDetected = async (text: string) => {
    if (!isCallActive || isProcessingAudio || !isVideoMode) return;
    
    setIsProcessingAudio(true);
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const { data, error } = await supabase.functions.invoke('azure-video-chat', {
        body: { 
          text,
          persona
        }
      });

      if (error) throw error;

      if (data?.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        currentAudioRef.current = audio;
        
        audio.addEventListener('ended', () => {
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
        });

        await audio.play();
      }
    } catch (error: any) {
      console.error('Error processing speech:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process speech",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleEndCall = () => {
    cleanup();
    setIsCallActive(false);
    setIsRecording(false);
    onCallStateChange(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex-1 min-h-0">
        {isCallActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <VideoGrid
              videoRef={videoRef}
              userName="You"
              isCallActive={isCallActive}
              persona={persona}
            />
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={azureVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-full">
                <span className="text-sm font-medium">{persona.name} (AI)</span>
              </div>
            </div>
          </div>
        ) : (
          <VideoDisplay
            stream={stream}
            videoRef={videoRef}
            isRecording={isRecording}
            currentEmotion={currentEmotion}
            trainingVideo={null}
            isCallActive={isCallActive}
          />
        )}
      </div>

      {isCallActive && (
        <VideoAnalysis
          onSpeechDetected={handleSpeechDetected}
          personaId={persona.id}
          language={persona.model_config?.language}
        />
      )}

      <CallControls
        isCallActive={isCallActive}
        isLoading={isLoading}
        isRecording={isRecording}
        onStartCall={handleStartCall}
        onEndCall={handleEndCall}
        onStartRecording={() => setIsRecording(true)}
        onStopRecording={() => setIsRecording(false)}
      />
    </div>
  );
};

