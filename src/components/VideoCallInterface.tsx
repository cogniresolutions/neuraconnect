import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, PhoneOff } from 'lucide-react';
import AIPersonaVideo from './AIPersonaVideo';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { RealtimeChat } from '@/utils/RealtimeAudio';

interface VideoCallInterfaceProps {
  persona: any;
  onCallStateChange: (isActive: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  persona,
  onCallStateChange
}) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [trainingVideo, setTrainingVideo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout>();
  const { speak } = useTextToSpeech();
  const { transcribe } = useSpeechToText();

  useEffect(() => {
    const loadTrainingVideo = async () => {
      try {
        const { data: videos, error } = await supabase
          .from('training_videos')
          .select('*')
          .eq('persona_id', persona.id)
          .eq('processing_status', 'completed')
          .limit(1)
          .single();

        if (error) throw error;
        setTrainingVideo(videos);
      } catch (error) {
        console.error('Error loading training video:', error);
        toast({
          title: "Error",
          description: "Failed to load persona video",
          variant: "destructive",
        });
      }
    };

    if (persona?.id) {
      loadTrainingVideo();
    }
  }, [persona?.id, toast]);

  const analyzeVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const [emotionResponse, environmentResponse] = await Promise.all([
        supabase.functions.invoke('analyze-emotion', {
          body: { 
            imageData,
            userId: (await supabase.auth.getUser()).data.user?.id,
            personaId: persona.id
          }
        }),
        supabase.functions.invoke('analyze-environment', {
          body: { 
            imageData,
            userId: (await supabase.auth.getUser()).data.user?.id,
            personaId: persona.id
          }
        })
      ]);

      if (emotionResponse.error) throw emotionResponse.error;
      if (environmentResponse.error) throw environmentResponse.error;

      const dominantEmotion = Object.entries(emotionResponse.data?.emotions || {})
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];
      
      setCurrentEmotion(dominantEmotion || 'neutral');

      // Store analysis in Supabase
      const { error: dbError } = await supabase
        .from('emotion_analysis')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          persona_id: persona.id,
          emotion_data: emotionResponse.data,
          environment_data: environmentResponse.data,
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze video",
        variant: "destructive",
      });
    }
  };

  const startCall = async () => {
    try {
      setIsLoading(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Initialize chat and analysis
      chatRef.current = new RealtimeChat((event) => {
        if (event.type === 'response.text') {
          speak(event.content, {
            voice: persona.voice_style,
            language: persona.language || 'en'
          });
        }
      });
      
      await chatRef.current.init(persona);

      // Start periodic analysis
      analysisIntervalRef.current = setInterval(analyzeVideo, 5000);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          personaId: persona.id,
          userId: user.id,
          action: 'start'
        }
      });

      if (error) throw error;

      setIsCallActive(true);
      onCallStateChange(true);
      
      toast({
        title: "Call Started",
        description: `Connected with ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      toast({
        title: "Call Error",
        description: error.message || "Failed to start call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          personaId: persona.id,
          userId: user.id,
          action: 'end'
        }
      });

      if (error) throw error;

      setIsCallActive(false);
      onCallStateChange(false);
      
      toast({
        title: "Call Ended",
        description: `Disconnected from ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error ending call:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to end call",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      <div className="grid grid-cols-2 gap-4">
        {isCallActive && (
          <>
            <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              {currentEmotion && (
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
                  Current Emotion: {currentEmotion}
                </div>
              )}
            </div>
            <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
              {trainingVideo && (
                <AIPersonaVideo
                  trainingVideoUrl={trainingVideo.video_url}
                  expressionSegments={trainingVideo.expression_segments}
                  currentEmotion={currentEmotion}
                  isPlaying={isCallActive}
                />
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2">
        {!isCallActive ? (
          <Button
            onClick={startCall}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Start Call
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={endCall}
            variant="destructive"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Call
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoCallInterface;