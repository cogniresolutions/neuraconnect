import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoAnalysis } from './video/VideoAnalysis';
import { VideoHeader } from './video/VideoHeader';
import { UserVideo } from './video/UserVideo';
import { PersonaVideo } from './video/PersonaVideo';
import { DialogsContainer } from './video/DialogsContainer';
import { CallControls } from './video/CallControls';

interface VideoCallInterfaceProps {
  persona: any;
  onCallStateChange: (isActive: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  persona,
  onCallStateChange,
}) => {
  const navigate = useNavigate();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

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
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCallActive]);

  const handleStartCall = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsCallActive(true);
      setIsLoading(false);
      onCallStateChange(true);
    }, 1500);
  };

  const handleEndCall = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setIsCallActive(false);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    onCallStateChange(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleSpeechDetected = (text: string) => {
    console.log('Speech detected:', text);
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

export default VideoCallInterface;