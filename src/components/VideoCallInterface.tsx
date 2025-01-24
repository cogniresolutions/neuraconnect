import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VideoAnalysis } from './video/VideoAnalysis';
import { CallControls } from './video/CallControls';
import { ConsentDialog } from './video/ConsentDialog';
import { supabase } from '@/integrations/supabase/client';
import { logAPIUsage, handleAPIError, measureResponseTime } from '@/utils/errorHandling';

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
  const [subtitles, setSubtitles] = useState<string>('');
  const [translatedSubtitles, setTranslatedSubtitles] = useState<string>('');
  const targetLanguage = persona?.model_config?.language || 'en';

  const translateText = async (text: string) => {
    const getMeasureTime = measureResponseTime();
    
    try {
      const { data, error } = await supabase.functions.invoke('azure-translate', {
        body: { text, targetLanguage }
      });

      const responseTime = getMeasureTime();
      await logAPIUsage('azure-translate', error ? 'error' : 'success', error, responseTime);

      if (error) throw error;
      return data.translatedText;
    } catch (error: any) {
      handleAPIError(error, 'Translation');
      return text; // Fallback to original text
    }
  };

  useEffect(() => {
    const translateSubtitles = async () => {
      if (subtitles && targetLanguage !== 'en') {
        const translated = await translateText(subtitles);
        setTranslatedSubtitles(translated);
      }
    };

    translateSubtitles();
  }, [subtitles, targetLanguage]);

  const handleAnalysisComplete = async (analysis: any) => {
    const getMeasureTime = measureResponseTime();
    
    try {
      const { error } = await supabase
        .from('emotion_analysis')
        .insert([{
          persona_id: persona.id,
          emotion_data: analysis.emotions,
          environment_data: analysis.environment,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      const responseTime = getMeasureTime();
      await logAPIUsage('emotion-analysis', error ? 'error' : 'success', error, responseTime);

      if (error) throw error;
      
      console.log('Analysis results:', analysis);
    } catch (error: any) {
      handleAPIError(error, 'Emotion analysis');
    }
  };

  const startCall = async () => {
    const getMeasureTime = measureResponseTime();
    
    try {
      const { data, error } = await supabase.functions.invoke('video-call', {
        body: { 
          action: 'start',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id,
          language: targetLanguage
        }
      });

      const responseTime = getMeasureTime();
      await logAPIUsage('video-call-start', error ? 'error' : 'success', error, responseTime);

      if (error) throw error;

      setIsCallActive(true);
      onCallStateChange(true);
      
      toast({
        title: "Call Started",
        description: `Connected with ${persona.name}`,
      });
    } catch (error: any) {
      handleAPIError(error, 'Starting call');
    }
  };

  const endCall = async () => {
    const getMeasureTime = measureResponseTime();
    
    try {
      const { error } = await supabase.functions.invoke('video-call', {
        body: { 
          action: 'end',
          personaId: persona.id,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      const responseTime = getMeasureTime();
      await logAPIUsage('video-call-end', error ? 'error' : 'success', error, responseTime);

      if (error) throw error;

      setIsCallActive(false);
      onCallStateChange(false);
      
      toast({
        title: "Call Ended",
        description: `Disconnected from ${persona.name}`,
      });
    } catch (error: any) {
      handleAPIError(error, 'Ending call');
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {isCallActive && (
        <div className="w-full max-w-2xl space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <VideoAnalysis
              personaId={persona.id}
              onAnalysisComplete={handleAnalysisComplete}
              onSpeechDetected={setSubtitles}
            />
          </div>
          
          {(subtitles || translatedSubtitles) && (
            <div className="bg-black/80 p-4 rounded-lg text-white text-center">
              <p className="text-lg">{translatedSubtitles || subtitles}</p>
            </div>
          )}
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