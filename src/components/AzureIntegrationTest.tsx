import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mic, MicOff } from 'lucide-react';

const AZURE_CONTAINER_VIDEO_URL = "http://emma-server.dbfdh9d2gxhhgpd7.centralus.azurecontainer.io:8080/video";

const AzureIntegrationTest = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = AZURE_CONTAINER_VIDEO_URL;
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        toast({
          title: "Video Error",
          description: "Failed to play Azure Container video stream",
          variant: "destructive",
        });
      });
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await processAudioInput(base64Audio);
        };
        
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak to test the integration",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start audio recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processAudioInput = async (audioData: string) => {
    setIsProcessing(true);
    try {
      // First, convert speech to text
      const { data: speechData, error: speechError } = await supabase.functions.invoke('speech-to-text', {
        body: { audioData }
      });

      if (speechError) throw speechError;
      
      console.log('Speech recognized:', speechData.text);

      // Then, process with Azure OpenAI and get video response
      const { data: videoResponse, error: videoError } = await supabase.functions.invoke('azure-video-chat', {
        body: { 
          text: speechData.text,
          persona: {
            name: "Emma",
            voice_style: "en-US-JennyNeural",
            personality: "helpful and friendly AI assistant",
            skills: ["conversation", "assistance"],
            topics: ["general knowledge", "casual conversation"]
          }
        }
      });

      if (videoError) throw videoError;

      if (videoResponse?.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${videoResponse.audio}`);
        await audio.play();
      }

      toast({
        title: "Response Received",
        description: videoResponse.text,
      });
    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="relative aspect-video w-full max-w-2xl bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-full">
          <span className="text-sm font-medium">Azure Container Stream</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          variant={isRecording ? "destructive" : "default"}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AzureIntegrationTest;