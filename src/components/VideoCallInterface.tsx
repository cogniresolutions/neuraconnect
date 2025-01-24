import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VideoAnalysis } from './video/VideoAnalysis';
import { CallControls } from './video/CallControls';
import { ConsentDialog } from './video/ConsentDialog';
import { supabase } from '@/integrations/supabase/client';
import { logAPIUsage, handleAPIError, measureResponseTime } from '@/utils/errorHandling';
import { Card } from './ui/card';
import { Loader2, User } from 'lucide-react';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

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
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90">
      <div className="w-full max-w-7xl p-4 space-y-4">
        {isCallActive ? (
          <div className="grid grid-cols-2 gap-4">
            {/* User Video */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {!isStreamReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{userName || 'You'}</span>
              </div>
              <VideoAnalysis
                personaId={persona.id}
                onAnalysisComplete={() => {}}
                onSpeechDetected={() => {}}
              />
            </div>

            {/* Persona Video */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              {persona.profile_picture_url && (
                <img
                  src={persona.profile_picture_url}
                  alt={persona.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={persona.profile_picture_url} alt={persona.name} />
                  <AvatarFallback>{persona.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{persona.name}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src={persona.profile_picture_url} alt={persona.name} />
                <AvatarFallback>{persona.name[0]}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-white">Ready to call {persona.name}</h2>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
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
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
            <DialogDescription>
              Please enter your name to start the video call
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <Button 
              onClick={() => {
                if (userName.trim()) {
                  setShowNameDialog(false);
                  startCall();
                }
              }}
              disabled={!userName.trim()}
            >
              Start Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onAccept={() => {
          setShowConsentDialog(false);
          startCall();
        }}
        personaName={persona.name}
      />
    </div>
  );
};

export default VideoCallInterface;