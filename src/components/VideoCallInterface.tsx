import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VideoAnalysis } from './video/VideoAnalysis';
import { CallControls } from './video/CallControls';
import { ConsentDialog } from './video/ConsentDialog';
import { supabase } from '@/integrations/supabase/client';
import { logAPIUsage, handleAPIError, measureResponseTime } from '@/utils/errorHandling';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const targetLanguage = persona?.model_config?.language || 'en';

  const initializeMediaStream = async () => {
    try {
      console.log('Initializing media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('Media stream initialized:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('Video element playing');
      }

      // Initialize audio context
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);
      
      processor.onaudioprocess = (e) => {
        // Process audio data here
        const inputData = e.inputBuffer.getChannelData(0);
        console.log('Audio data received:', inputData.length);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
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
      return text;
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
    setIsLoading(true);
    const getMeasureTime = measureResponseTime();
    
    try {
      console.log('Starting call...');
      // Initialize media stream first
      await initializeMediaStream();

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
    const getMeasureTime = measureResponseTime();
    
    try {
      console.log('Ending call...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Track stopped:', track.kind);
        });
        streamRef.current = null;
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
        console.log('Audio context closed');
      }

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
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
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
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        console.log('Audio context closed on cleanup');
      }
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full max-w-4xl px-4">
      {isCallActive && (
        <Card className="w-full space-y-4 bg-black/5 backdrop-blur-lg border-white/10">
          <div className="aspect-video rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <VideoAnalysis
              personaId={persona.id}
              onAnalysisComplete={handleAnalysisComplete}
              onSpeechDetected={setSubtitles}
            />
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {isRecording ? 'Recording' : 'Live'}
              </Badge>
            </div>
          </div>
          
          {(subtitles || translatedSubtitles) && (
            <div className="p-4 rounded-lg bg-black/80 backdrop-blur-sm">
              <p className="text-lg text-center text-white font-medium">
                {translatedSubtitles || subtitles}
              </p>
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-center items-center gap-4">
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