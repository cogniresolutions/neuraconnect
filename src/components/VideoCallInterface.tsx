import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VideoAnalysis } from './video/VideoAnalysis';
import { CallControls } from './video/CallControls';
import { ConsentDialog } from './video/ConsentDialog';

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

  const handleAnalysisComplete = (analysis: any) => {
    // Update persona behavior based on analysis results
    console.log('Analysis results:', analysis);
  };

  const startCall = async () => {
    setIsCallActive(true);
    onCallStateChange(true);
    
    toast({
      title: "Call Started",
      description: `Connected with ${persona.name}`,
    });
  };

  const endCall = () => {
    setIsCallActive(false);
    onCallStateChange(false);
    
    toast({
      title: "Call Ended",
      description: `Disconnected from ${persona.name}`,
    });
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {isCallActive && (
        <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
          <VideoAnalysis
            personaId={persona.id}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      )}

      <CallControls
        isCallActive={isCallActive}
        isLoading={false}
        isRecording={isRecording}
        onStartCall={() => setShowConsentDialog(true)}
        onEndCall={endCall}
        onStartRecording={() => setIsRecording(true)}
        onStopRecording={() => setIsRecording(false)}
      />

      <ConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        onAccept={startCall}
        personaName={persona.name}
      />
    </div>
  );
};

export default VideoCallInterface;