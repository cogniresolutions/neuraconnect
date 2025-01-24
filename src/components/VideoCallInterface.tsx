import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoAnalysis } from './video/VideoAnalysis';
import { VideoHeader } from './video/VideoHeader';
import { UserVideo } from './video/UserVideo';
import { PersonaVideo } from './video/PersonaVideo';
import { DialogsContainer } from './video/DialogsContainer';
import { CallControls } from './video/CallControls';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoCallInterfaceProps {
  persona: any;
  onCallStateChange: (isActive: boolean) => void;
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  persona,
  onCallStateChange,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [userName, setUserName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  useEffect(() => {
    if (isCallActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setStream(mediaStream);
        })
        .catch((error) => {
          console.error('Error accessing media devices:', error);
          toast({
            title: 'Error',
            description: 'Failed to access camera or microphone',
            variant: 'destructive',
          });
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCallActive]);

  const handleStartCall = async () => {
    setIsLoading(true);
    try {
      const { data: session, error } = await supabase.functions.invoke('video-call', {
        body: {
          action: 'start',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id,
          personaConfig: {
            name: persona.name,
            personality: persona.personality,
            skills: persona.skills,
            topics: persona.topics,
          },
        },
      });

      if (error) throw error;

      setIsCallActive(true);
      onCallStateChange(true);
      toast({
        title: 'Call Started',
        description: `Connected with ${persona.name}`,
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to start call',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (isRecording) {
      handleStopRecording();
    }
    
    try {
      await supabase.functions.invoke('video-call', {
        body: {
          action: 'end',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id,
        },
      });

      setIsCallActive(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
      onCallStateChange(false);
      
      toast({
        title: 'Call Ended',
        description: 'The video call has been disconnected',
      });
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        title: 'Error',
        description: 'Failed to end call properly',
        variant: 'destructive',
      });
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    toast({
      title: 'Recording Started',
      description: 'Your conversation is now being recorded',
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast({
      title: 'Recording Stopped',
      description: 'Your conversation recording has been saved',
    });
  };

  const handleSpeechDetected = async (text: string) => {
    if (!isCallActive || isProcessingAudio) return;
    
    setIsProcessingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke('azure-chat', {
        body: { 
          message: text,
          persona: {
            name: persona.name,
            personality: persona.personality,
            skills: persona.skills,
            topics: persona.topics
          }
        }
      });

      if (error) throw error;

      // Convert response to speech using Azure TTS
      const { data: audioData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: data.response,
          voice: persona.voice_style
        }
      });

      if (ttsError) throw ttsError;

      // Play the audio response
      if (audioData?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${audioData.audioContent}`);
        await audio.play();
      }

    } catch (error) {
      console.error('Error processing speech:', error);
      toast({
        title: 'Error',
        description: 'Failed to process speech',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const onBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <VideoHeader personaName={persona.name} onBack={onBack} />
      
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UserVideo videoRef={videoRef} userName={userName} />
          <PersonaVideo isCallActive={isCallActive} persona={persona} />
        </div>

        <CallControls
          isCallActive={isCallActive}
          isLoading={isLoading}
          isRecording={isRecording}
          onStartCall={() => setShowConsentDialog(true)}
          onEndCall={handleEndCall}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />

        <div className="hidden">
          <VideoAnalysis
            onSpeechDetected={handleSpeechDetected}
            personaId={persona.id}
          />
        </div>
      </div>

      <DialogsContainer
        showNameDialog={showNameDialog}
        setShowNameDialog={setShowNameDialog}
        userName={userName}
        setUserName={setUserName}
        showConsentDialog={showConsentDialog}
        setShowConsentDialog={setShowConsentDialog}
        onStartCall={handleStartCall}
        personaName={persona.name}
      />
    </div>
  );
};