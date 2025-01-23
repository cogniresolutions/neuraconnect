import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VideoAnalysis } from './video/VideoAnalysis';
import { CallControls } from './video/CallControls';
import { ConsentDialog } from './video/ConsentDialog';
import { supabase } from '@/integrations/supabase/client';

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

  const handleAnalysisComplete = async (analysis: any) => {
    try {
      // Update persona behavior based on analysis results
      const { error } = await supabase
        .from('emotion_analysis')
        .insert([{
          persona_id: persona.id,
          emotion_data: analysis.emotions,
          environment_data: analysis.environment,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;
      
      console.log('Analysis results:', analysis);
    } catch (error: any) {
      console.error('Error saving analysis:', error);
    }
  };

  const startCall = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('video-call', {
        body: { 
          action: 'start',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    try {
      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          action: 'end',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id
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
        description: error.message,
        variant: "destructive",
      });
    }
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