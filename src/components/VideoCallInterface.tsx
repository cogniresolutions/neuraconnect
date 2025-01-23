import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
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
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isInitializingDevices, setIsInitializingDevices] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
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
      } catch (error: any) {
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

    // Cleanup function
    return () => {
      cleanupMedia();
    };
  }, [persona?.id, toast]);

  const initializeDevice = async (type: 'camera' | 'microphone') => {
    setIsInitializingDevices(true);
    try {
      const constraints = {
        video: type === 'camera',
        audio: type === 'microphone'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (type === 'camera') {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsCameraEnabled(true);
        }
      } else {
        streamRef.current = stream;
        setIsMicEnabled(true);
        
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({
            sampleRate: 24000,
          });
        }
        audioSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      }

      toast({
        title: `${type === 'camera' ? 'Camera' : 'Microphone'} Enabled`,
        description: `Successfully initialized ${type}`,
      });
    } catch (error: any) {
      console.error(`${type} initialization error:`, error);
      toast({
        title: `${type === 'camera' ? 'Camera' : 'Microphone'} Error`,
        description: error.message || `Failed to initialize ${type}`,
        variant: "destructive",
      });
      
      if (type === 'camera') {
        setIsCameraEnabled(false);
      } else {
        setIsMicEnabled(false);
      }
    } finally {
      setIsInitializingDevices(false);
    }
  };

  const toggleCamera = async () => {
    if (isCameraEnabled) {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
        setIsCameraEnabled(false);
      }
    } else {
      await initializeDevice('camera');
    }
  };

  const toggleMicrophone = async () => {
    if (isMicEnabled) {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.stop());
        setIsMicEnabled(false);
      }
    } else {
      await initializeDevice('microphone');
    }
  };

  const cleanupMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
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
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    setIsCameraEnabled(false);
    setIsMicEnabled(false);
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
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Initialize microphone if not already enabled
      if (!isMicEnabled) {
        await initializeDevice('microphone');
      }

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
      cleanupMedia();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      cleanupMedia();

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
              {!isCameraEnabled && (
                <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800/50">
                  Camera Off
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
        <Button
          onClick={toggleCamera}
          variant="secondary"
          className={`${isCameraEnabled ? 'bg-gray-700' : 'bg-gray-600'} hover:bg-gray-600`}
          disabled={isLoading || isInitializingDevices}
        >
          {isCameraEnabled ? (
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
        <Button
          onClick={toggleMicrophone}
          variant="secondary"
          className={`${isMicEnabled ? 'bg-gray-700' : 'bg-gray-600'} hover:bg-gray-600`}
          disabled={isLoading || isInitializingDevices}
        >
          {isMicEnabled ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Mute
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Unmute
            </>
          )}
        </Button>
        {!isCallActive ? (
          <Button
            onClick={startCall}
            disabled={isLoading || isInitializingDevices}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading || isInitializingDevices ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isInitializingDevices ? 'Initializing...' : 'Connecting...'}
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
            disabled={isInitializingDevices}
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
