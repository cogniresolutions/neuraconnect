import React, { useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { CallControls } from './video/CallControls';
import { ConsentDialog } from './video/ConsentDialog';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';

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
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const { speak } = useTextToSpeech();
  const { transcribe } = useSpeechToText();

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

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      
      toast({
        title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
        description: isMuted ? "Others can now hear you" : "Others cannot hear you",
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

  const handleAnalysisComplete = (analysis: any) => {
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
        audio: true 
      });
      
      streamRef.current = stream;
      await initializeAudio(stream);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!persona?.id) {
        throw new Error('Invalid persona configuration');
      }

      console.log('Starting call with:', {
        personaId: persona.id,
        userId: user.id,
        personaConfig: {
          name: persona.name,
          voiceStyle: persona.voice_style,
          modelConfig: persona.model_config
        }
      });

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
        console.error('Video call function error:', error);
        throw error;
      }

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
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!persona?.id) {
        throw new Error('Invalid persona configuration');
      }

      console.log('Ending call with:', {
        personaId: persona.id,
        userId: user.id
      });

      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          personaId: persona.id,
          userId: user.id,
          action: 'end'
        }
      });

      if (error) {
        console.error('Error ending call:', error);
        throw error;
      }

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
      <div className="flex gap-2">
        {isCallActive && (
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMute}
            className="bg-black/50 hover:bg-black/70"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-white" />
            )}
          </Button>
        )}
      </div>

      <CallControls
        isCallActive={isCallActive}
        isLoading={isLoading}
        isRecording={isRecording}
        onStartCall={startCall}
        onEndCall={endCall}
        onStartRecording={() => setIsRecording(true)}
        onStopRecording={() => setIsRecording(false)}
      />

      <ConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onAccept={handleConsentAccepted}
        personaName={persona.name}
      />
    </div>
  );
};

export default VideoCallInterface;