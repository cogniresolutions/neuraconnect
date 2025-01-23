import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, PhoneOff } from 'lucide-react';
import AIPersonaVideo from './AIPersonaVideo';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { analyzeEmotionAndEnvironment } from '@/utils/emotionAnalysis';
import { captureVideoFrame } from '@/utils/videoCapture';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const { speak } = useTextToSpeech();
  const { transcribe } = useSpeechToText();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const analysisIntervalRef = useRef<NodeJS.Timeout>();
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  const performAnalysis = async () => {
    if (!videoRef.current || !streamRef.current) return;
    
    try {
      const imageData = captureVideoFrame(videoRef.current);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const analysis = await analyzeEmotionAndEnvironment(
        imageData,
        persona.id,
        user.id
      );

      setLastAnalysis(analysis);
      if (analysis.emotions) {
        const dominantEmotion = Object.entries(analysis.emotions)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];
        setCurrentEmotion(dominantEmotion || 'neutral');
      }

      if (chatRef.current && analysis.environment) {
        chatRef.current.updateContext({
          environment: analysis.environment,
          userEmotion: currentEmotion
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

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

  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          const transcription = await transcribe(base64Audio);
          await handleTranscriptionComplete(transcription);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Transcription Error",
            description: "Failed to process speech",
            variant: "destructive",
          });
        }
      };

      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const initializeAudio = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      audioSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      audioSourceRef.current.connect(audioContextRef.current.destination);
      
      console.log('Audio initialized successfully');

      await speakWelcomeMessage();
      await initializeChat();

      startAudioProcessing(stream);
    } catch (error) {
      console.error('Error initializing audio:', error);
      throw error;
    }
  };

  const startAudioProcessing = (stream: MediaStream) => {
    if (!chatRef.current) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(1024, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (chatRef.current && isCallActive) {
        const inputData = e.inputBuffer.getChannelData(0);
        chatRef.current.sendMessage(Array.from(inputData));
      }
    };

    audioContextRef.current = audioContext;
    audioSourceRef.current = source;
  };

  const initializeChat = async () => {
    try {
      console.log('Initializing chat with persona:', persona);
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(persona);
      console.log('Chat initialized successfully');
    } catch (error) {
      console.error('Error initializing chat:', error);
      throw error;
    }
  };

  const handleMessage = async (event: any) => {
    console.log('Received message event:', event);
    
    if (event.type === 'response.text') {
      try {
        const emotion = event.emotion || 'neutral';
        setCurrentEmotion(emotion);

        await speak(event.content, {
          voice: persona.voice_style,
          language: persona.language || 'en'
        });
      } catch (error) {
        console.error('Error speaking response:', error);
      }
    } else if (event.type === 'error') {
      console.error('Chat error:', event.error);
      toast({
        title: "Chat Error",
        description: event.error?.message || "An error occurred during the conversation",
        variant: "destructive",
      });
    }
  };

  const handleTranscriptionComplete = async (transcription: string) => {
    console.log('Transcription received:', transcription);
    if (chatRef.current) {
      chatRef.current.sendMessage(transcription);
    }
  };

  const speakWelcomeMessage = async () => {
    try {
      const welcomeMessage = `Hello! I'm ${persona.name}. How can I assist you today?`;
      await speak(welcomeMessage, {
        voice: persona.voice_style,
        language: persona.language || 'en'
      });
      console.log('Welcome message spoken successfully');
    } catch (error) {
      console.error('Error speaking welcome message:', error);
    }
  };

  const startCall = async () => {
    try {
      setShowConsentDialog(true);
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast({
        title: "Call Error",
        description: error.message || "Failed to start call",
        variant: "destructive",
      });
    }
  };

  const handleConsentAccepted = async () => {
    try {
      setIsLoading(true);
      setShowConsentDialog(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      await initializeAudio(stream);
      analysisIntervalRef.current = setInterval(performAnalysis, 1000); // Updated to 1 second interval

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('video-call', {
        body: { 
          personaId: persona.id,
          userId: user.id,
          action: 'start',
          personaConfig: {
            name: persona.name,
            voiceStyle: persona.voice_style,
            modelConfig: persona.model_config
          }
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
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }

      console.log('Ending call...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Invoking video-call end function...');
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
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
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
              {isRecording && (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500 px-2 py-1 rounded-full text-white text-xs">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Recording
                </div>
              )}
              {lastAnalysis?.emotions && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
                  Emotion: {currentEmotion}
                </div>
              )}
            </div>
            <div className="relative w-64 h-48 rounded-lg overflow-hidden bg-gray-900">
              {trainingVideo ? (
                <AIPersonaVideo
                  trainingVideoUrl={trainingVideo.video_url}
                  expressionSegments={trainingVideo.expression_segments}
                  currentEmotion={currentEmotion}
                  isPlaying={isCallActive}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  No training video available
                </div>
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
          <>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="mr-2"
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            <Button
              onClick={endCall}
              variant="destructive"
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End Call
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Camera and Microphone Access</AlertDialogTitle>
            <AlertDialogDescription>
              To start the call, we need access to your camera and microphone. 
              This will allow you to interact with {persona.name} in real-time. 
              Your video feed will be analyzed for emotions and environment context 
              to provide a more natural conversation experience.
              Your privacy is important to us, and this data is only used during the call.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentAccepted}>
              Allow Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VideoCallInterface;