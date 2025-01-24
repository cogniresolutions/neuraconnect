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

  useEffect(() => {
    if (isCallActive) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Clean up audio context and current audio
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, [isCallActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error",
        description: "Could not access camera or microphone. Please make sure they are connected and permissions are granted.",
        variant: "destructive",
      });
    }
  };

  const handleStartCall = async () => {
    setIsLoading(true);
    try {
      await startCamera();
      setIsCallActive(true);
      onCallStateChange(true);
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
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

  const handleSpeechDetected = async (text: string) => {
    if (!isCallActive || isProcessingAudio || !isVideoMode) return;
    
    setIsProcessingAudio(true);
    try {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const { data, error } = await supabase.functions.invoke('azure-chat', {
        body: { 
          message: text,
          persona_id: persona.id
        }
      });

      if (error) throw error;

      if (isVideoMode) {
        const { data: audioData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
          body: { 
            text: data.response,
            voice: persona.voice_style
          }
        });

        if (ttsError) throw ttsError;

        if (audioData?.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${audioData.audioContent}`);
          currentAudioRef.current = audio;
          
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }

          audio.addEventListener('ended', () => {
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
          });

          await audio.play();
        }
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

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex-1 min-h-0">
        {isCallActive ? (
          <VideoGrid
            videoRef={videoRef}
            userName="You"
            isCallActive={isCallActive}
            persona={persona}
          />
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
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
      />
    </div>
  );
};