import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Loader2, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIVideoInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
}

interface AnalysisResult {
  emotions?: {
    happiness?: number;
    sadness?: number;
    surprise?: number;
    anger?: number;
  };
  environment?: {
    description?: string;
    tags?: string[];
    objects?: string[];
  };
}

const AIVideoInterface: React.FC<AIVideoInterfaceProps> = ({ persona, onSpeakingChange }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult>({});
  const chatRef = useRef<RealtimeChat | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout>();

  const analyzeVideo = async (videoElement: HTMLVideoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(videoElement, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      console.log('Starting video analysis...');
      
      // Call both analysis functions
      const [emotionResponse, environmentResponse] = await Promise.all([
        supabase.functions.invoke('analyze-emotion', {
          body: { 
            imageData,
            personaId: persona.id,
            userId: (await supabase.auth.getUser()).data.user?.id
          }
        }),
        supabase.functions.invoke('analyze-environment', {
          body: { 
            imageData,
            personaId: persona.id,
            userId: (await supabase.auth.getUser()).data.user?.id
          }
        })
      ]);

      if (emotionResponse.error) throw emotionResponse.error;
      if (environmentResponse.error) throw environmentResponse.error;
      
      console.log('Analysis results:', { emotion: emotionResponse.data, environment: environmentResponse.data });
      
      setLastAnalysis({
        emotions: emotionResponse.data?.emotions,
        environment: environmentResponse.data?.environment
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze video",
        variant: "destructive",
      });
    }
  };

  const handleMessage = (event: any) => {
    console.log('Received WebSocket message:', event);
    
    if (event.type === 'response.audio.delta') {
      console.log('Received audio delta, persona is speaking');
      onSpeakingChange(true);
    } else if (event.type === 'response.audio.done') {
      console.log('Audio response completed, persona stopped speaking');
      onSpeakingChange(false);
    } else if (event.type === 'error') {
      console.error('WebSocket error:', event.error);
      toast({
        title: "Connection Error",
        description: event.error?.message || "An error occurred during the conversation",
        variant: "destructive",
      });
    }
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing chat with persona:', persona);
      
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(persona);
      
      setIsConnected(true);
      console.log('WebSocket connection established successfully');
      
      toast({
        title: "Connected",
        description: `${persona.name} is ready to chat`,
      });

      if (isVideoEnabled) {
        await startVideo();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = () => {
    console.log('Ending conversation and cleaning up connections');
    chatRef.current?.disconnect();
    stopVideo();
    setIsConnected(false);
    onSpeakingChange(false);
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsVideoEnabled(true);
        
        // Start analysis interval
        analysisIntervalRef.current = setInterval(() => {
          if (videoRef.current) {
            analyzeVideo(videoRef.current);
          }
        }, 5000); // Analyze every 5 seconds
      }
    } catch (error: any) {
      console.error('Video error:', error);
      toast({
        title: "Video Error",
        description: error.message || "Failed to access camera",
        variant: "destructive",
      });
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoEnabled(false);
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
  };

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      stopVideo();
    } else {
      await startVideo();
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      endConversation();
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {isVideoEnabled && (
        <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {lastAnalysis.emotions && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
              Emotion: {Object.entries(lastAnalysis.emotions)
                .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={toggleVideo}
          variant="secondary"
          disabled={isLoading}
        >
          {isVideoEnabled ? (
            <>
              <VideoOff className="mr-2 h-4 w-4" />
              Disable Camera
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Enable Camera
            </>
          )}
        </Button>
        {!isConnected ? (
          <Button 
            onClick={startConversation}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Conversation
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={endConversation}
            variant="secondary"
          >
            <MicOff className="mr-2 h-4 w-4" />
            End Conversation
          </Button>
        )}
      </div>
    </div>
  );
};

export default AIVideoInterface;