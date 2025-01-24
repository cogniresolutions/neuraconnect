import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { VideoAnalysis } from './video/VideoAnalysis';
import { CallControls } from './video/CallControls';
import { VideoHeader } from './video/VideoHeader';
import { VideoGrid } from './video/VideoGrid';
import { DialogsContainer } from './video/DialogsContainer';
import { supabase } from '@/integrations/supabase/client';
import { logAPIUsage, handleAPIError, measureResponseTime } from '@/utils/errorHandling';
import { Loader2 } from 'lucide-react';

interface VideoCallInterfaceProps {
  persona: any;
  onCallStateChange: (isActive: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  persona,
  onCallStateChange
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initializeMediaStream = async () => {
    try {
      console.log('Initializing media stream...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Media stream initialized:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
        setIsStreamReady(true);
        console.log('Video stream is now playing');
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Error",
        description: "Failed to access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const startCall = async () => {
    if (!userName.trim()) {
      setShowNameDialog(true);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting call...');
      await initializeMediaStream();

      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          action: 'start',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id,
          userName: userName
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
      handleAPIError(error, 'Starting call');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    setIsLoading(true);
    
    try {
      console.log('Ending call...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Track stopped:', track.kind);
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          action: 'end',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      setIsCallActive(false);
      setIsStreamReady(false);
      onCallStateChange(false);
      
      toast({
        title: "Call Ended",
        description: `Disconnected from ${persona.name}`,
      });
    } catch (error: any) {
      handleAPIError(error, 'Ending call');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      console.log('Cleaning up video call interface...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Track stopped on cleanup:', track.kind);
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <VideoHeader personaName={persona.name} onBack={() => navigate(-1)} />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <VideoGrid
          videoRef={videoRef}
          userName={userName}
          isCallActive={isCallActive}
          persona={persona}
        />
      )}

      <div className="hidden">
        <VideoAnalysis
          personaId={persona.id}
          onAnalysisComplete={() => {}}
          onSpeechDetected={() => {}}
        />
      </div>

      <div className="p-4 flex justify-center gap-4">
        <CallControls
          isCallActive={isCallActive}
          isLoading={isLoading}
          isRecording={isRecording}
          onStartCall={() => setShowConsentDialog(true)}
          onEndCall={endCall}
          onStartRecording={() => setIsRecording(true)}
          onStopRecording={() => setIsRecording(false)}
        />
      </div>

      <DialogsContainer
        showNameDialog={showNameDialog}
        setShowNameDialog={setShowNameDialog}
        userName={userName}
        setUserName={setUserName}
        showConsentDialog={showConsentDialog}
        setShowConsentDialog={setShowConsentDialog}
        onStartCall={startCall}
        personaName={persona.name}
      />
    </div>
  );
};

export default VideoCallInterface;
