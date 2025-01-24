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

  // Cleanup function to stop all media tracks and reset audio
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
  };

  // Effect to cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const startCamera = async () => {
    console.log('Starting camera...');
    try {
      // First cleanup any existing streams
      cleanup();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('Media stream obtained:', mediaStream);
      
      if (!mediaStream) {
        throw new Error('Failed to get media stream');
      }

      if (!videoRef.current) {
        console.error('Video ref is null');
        throw new Error('Video element not found');
      }

      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      
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
      // First ensure camera is started
      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        throw new Error('Failed to start camera');
      }

      // Then create the conversation
      const { data: conversationData, error: conversationError } = await supabase.functions.invoke('create-conversation', {
        body: {
          persona_id: persona.id,
          conversation_name: `Call with ${persona.name}`,
          context: 'video_call'
        }
      });

      if (conversationError) throw conversationError;
      console.log('Conversation created:', conversationData);

      // Finally activate the call
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

  const handleSpeechDetected = async (text: string) => {
    if (!isCallActive || isProcessingAudio || !isVideoMode) return;
    
    setIsProcessingAudio(true);
    try {
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
        onStartRecording={() => setIsRecording(true)}
        onStopRecording={() => setIsRecording(false)}
      />
    </div>
  );
};