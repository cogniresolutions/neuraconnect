import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VideoDisplay from './video/VideoDisplay';
import CallControls from './video/CallControls';
import AIPersonaVideo from './AIPersonaVideo';
import { useToast } from '@/hooks/use-toast';

const VideoCallInterface = () => {
  const { personaId } = useParams();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [persona, setPersona] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (personaId) {
      loadPersona();
    }
  }, [personaId]);

  const loadPersona = async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();

      if (error) throw error;
      setPersona(data);
    } catch (error) {
      console.error('Error loading persona:', error);
      toast({
        title: "Error",
        description: "Failed to load persona information",
        variant: "destructive",
      });
    }
  };

  const startCall = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      setIsCallActive(true);

      // Show welcome message from persona
      toast({
        title: `${persona?.name || 'AI Assistant'} joined the call`,
        description: `Hello! I'm ${persona?.name || 'your AI Assistant'}. How can I help you today?`,
      });

    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setIsCallActive(false);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
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

  const handleSpeakingChange = (speaking: boolean) => {
    setIsSpeaking(speaking);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 items-center justify-center">
        {isCallActive && (
          <>
            <div className="w-full lg:w-1/2">
              <VideoDisplay stream={localStream} muted={true} />
            </div>
            <div className="w-full lg:w-1/2">
              <AIPersonaVideo
                trainingVideoUrl={persona?.avatar_model_url}
                isPlaying={isSpeaking}
                onReady={() => {
                  console.log('AI Persona video ready');
                }}
              />
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4">
        <CallControls
          isCallActive={isCallActive}
          isLoading={isLoading}
          isMuted={isMuted}
          onStartCall={startCall}
          onEndCall={endCall}
          onToggleMute={toggleMute}
        />
      </div>
    </div>
  );
};

export default VideoCallInterface;