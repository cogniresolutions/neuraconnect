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
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
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
        setIsLoadingVideo(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to start a video call",
            variant: "destructive",
          });
          return;
        }

        const { data: videos, error } = await supabase
          .from('training_videos')
          .select('*')
          .eq('persona_id', persona.id)
          .eq('processing_status', 'completed')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching training video:', error);
          throw error;
        }

        if (!videos) {
          toast({
            title: "No Training Video",
            description: "This persona doesn't have any processed training videos yet",
            variant: "destructive",
          });
          return;
        }

        setTrainingVideo(videos);
        console.log('Training video loaded successfully:', videos);
      } catch (error: any) {
        console.error('Error loading training video:', error);
        toast({
          title: "Error",
          description: "Failed to load persona video: " + error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingVideo(false);
      }
    };

    if (persona?.id) {
      loadTrainingVideo();
    }

    return () => {
      cleanupMedia();
    };
  }, [persona?.id, toast]);

  const initializeDevice = async (type: 'camera' | 'microphone') => {
    console.log(`Initializing ${type}...`);
    setIsInitializingDevices(true);
    try {
      const constraints = {
        video: type === 'camera' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
        audio: type === 'microphone' ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      console.log(`Requesting ${type} access with constraints:`, constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`${type} access granted:`, stream);

      if (type === 'camera' && videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraEnabled(true);
      } else if (type === 'microphone') {
        streamRef.current = stream;
        setIsMicEnabled(true);
        
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({
            sampleRate: 24000,
          });
        }
        audioSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      }

      console.log(`${type} initialized successfully`);
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
        streamRef.current.getVideoTracks().forEach(track => {
          track.stop();
          console.log('Camera track stopped');
        });
        setIsCameraEnabled(false);
      }
    } else {
      await initializeDevice('camera');
    }
  };

  const toggleMicrophone = async () => {
    if (isMicEnabled) {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => {
          track.stop();
          console.log('Microphone track stopped');
        });
        setIsMicEnabled(false);
      }
    } else {
      await initializeDevice('microphone');
    }
  };

  const cleanupMedia = () => {
    console.log('Cleaning up media resources...');
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
      console.log('Audio source disconnected');
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      console.log('Audio context closed');
    }
    
    setIsCameraEnabled(false);
    setIsMicEnabled(false);
  };

  const initializeChat = async () => {
    console.log('Starting chat initialization...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Auth check result:', user);
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('Authentication required');
      }

      if (chatRef.current) {
        console.log('Cleaning up existing chat instance...');
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      console.log('Creating new RealtimeChat instance with persona:', persona);
      chatRef.current = new RealtimeChat({
        onMessage: handleMessage,
        persona: persona
      });
      
      console.log('Connecting to chat...');
      await chatRef.current.connect();
      console.log('Chat connection established successfully');
      
      return true;
    } catch (error) {
      console.error('Chat initialization error:', error);
      throw error;
    }
  };

  const handleMessage = async (event: any) => {
    console.log('Received message event:', event);
    
    if (event.type === 'response.text') {
      try {
        const emotion = event.emotion || 'neutral';
        setCurrentEmotion(emotion);
        console.log('Processing text response with emotion:', emotion);

        await speak(event.content, {
          voice: persona.voice_style,
          language: persona.language || 'en'
        });
      } catch (error) {
        console.error('Error processing message:', error);
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

  const startCall = async () => {
    console.log('Start call initiated');
    if (isLoading) {
      console.log('Call already in progress, ignoring click');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Checking authentication...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        throw new Error('Authentication required');
      }

      if (!trainingVideo) {
        throw new Error('No processed training video available');
      }

      console.log('Starting call initialization sequence...');

      // Initialize microphone if not already enabled
      if (!isMicEnabled) {
        console.log('Initializing microphone...');
        await initializeDevice('microphone');
      }

      console.log('Initializing chat connection...');
      const chatInitialized = await initializeChat();
      
      if (!chatInitialized) {
        throw new Error('Failed to initialize chat');
      }

      console.log('Invoking video-call function...');
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

      if (error) {
        console.error('Error from video-call function:', error);
        throw error;
      }

      console.log('Call started successfully:', data);
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
      console.log('Ending call...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
        console.log('Chat disconnected');
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

      console.log('Call ended successfully');
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
              {isLoadingVideo ? (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : trainingVideo ? (
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
            disabled={isLoading || isInitializingDevices || isLoadingVideo}
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