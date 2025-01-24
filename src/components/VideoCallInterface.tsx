import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoDisplay } from "./video/VideoDisplay";
import { VideoAnalysis } from "./video/VideoAnalysis";
import { CallControls } from "./video/CallControls";
import { VideoGrid } from "./video/VideoGrid";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import AzureVideoService from '@/services/AzureVideoService';

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
  const azureVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const [isVideoElementReady, setIsVideoElementReady] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    console.log('VideoCallInterface mounted');
    mountedRef.current = true;

    return () => {
      console.log('VideoCallInterface unmounting');
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    console.log('Running cleanup in VideoCallInterface');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
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
      AzureVideoService.getInstance().cleanup();
    }
    
    if (chatRef.current) {
      chatRef.current.disconnect();
      chatRef.current = null;
    }
    
    setIsVideoElementReady(false);
  };

  const startCamera = async () => {
    console.log('Starting camera initialization...');
    try {
      cleanup();

      if (!videoRef.current || !azureVideoRef.current) {
        console.error('Video elements not found');
        throw new Error('Video elements not initialized');
      }

      console.log('Requesting media stream...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (!mountedRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        throw new Error('Component unmounted during initialization');
      }

      console.log('Setting up media stream...');
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      
      await videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        throw error;
      });

      // Initialize Azure video stream
      await AzureVideoService.getInstance().initialize(azureVideoRef.current);
      
      // Initialize realtime chat
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init({
        ...persona,
        voice: persona.voice_style || 'alloy'
      });
      
      console.log('All video streams initialized successfully');
      return true;
    } catch (error) {
      console.error('Camera initialization error:', error);
      cleanup();
      throw error;
    }
  };

  const handleMessage = async (event: any) => {
    console.log('Received WebSocket message:', event);
    
    if (event.type === 'response.audio.delta') {
      console.log('Received audio delta, AI is speaking');
      if (event.audio) {
        try {
          const audioData = atob(event.audio);
          const arrayBuffer = new ArrayBuffer(audioData.length);
          const view = new Uint8Array(arrayBuffer);
          for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
          }
          
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.start(0);
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }
  };

  const handleSpeechDetected = async (text: string) => {
    if (!chatRef.current || !isCallActive) return;
    
    try {
      await chatRef.current.sendMessage(text);
    } catch (error) {
      console.error('Error handling speech:', error);
    }
  };

  const handleStartRecording = async () => {
    if (!stream) {
      console.error('No media stream available');
      return;
    }

    try {
      setIsRecording(true);
      // Add your recording logic here
      toast({
        title: "Recording Started",
        description: "Your call is now being recorded",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    try {
      setIsRecording(false);
      // Add your stop recording logic here
      toast({
        title: "Recording Stopped",
        description: "Your recording has been saved",
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
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

  const handleEndCall = () => {
    cleanup();
    setIsCallActive(false);
    setIsRecording(false);
    onCallStateChange(false);
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
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to start your call with {persona.name}?</h2>
              <p className="text-gray-500">Click the "Start Call" button below to begin your conversation.</p>
            </div>
          </div>
        )}
      </div>

      {isCallActive && (
        <VideoAnalysis
          onSpeechDetected={handleSpeechDetected}
          personaId={persona.id}
          language={persona.model_config?.language}
        />
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
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
    </div>
  );
};
