import React, { useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { CallControls } from './video/CallControls';
import { ConsentDialog } from './video/ConsentDialog';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';

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
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const { speak } = useTextToSpeech();
  const { transcribe } = useSpeechToText();

  const handleMessage = async (event: any) => {
    console.log('Received message event:', event);
    
    if (event.type === 'response.text') {
      try {
        const emotion = event.emotion || 'neutral';
        setCurrentEmotion(emotion);

        await speak(event.content, {
          voice: persona.voice_style,
          language: persona.language || 'en'
        });
      } catch (error) {
        console.error('Error speaking response:', error);
      }
    } else if (event.type === 'error') {
      console.error('Chat error:', event.error);
      toast({
        title: "Chat Error",
        description: event.error?.message || "An error occurred during the conversation",
        variant: "destructive",
      });
    }
  };

  const startCall = async () => {
    try {
      setIsLoading(true);
      console.log('Starting call with persona:', persona);

      // Get user media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: true
      });
      streamRef.current = stream;

      // Initialize audio context and processing
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      audioContextRef.current = audioContext;
      audioSourceRef.current = source;

      // Initialize chat with persona
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(persona);

      // Create video call session in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.from('tavus_sessions').insert({
        user_id: user.id,
        conversation_id: crypto.randomUUID(),
        status: 'active',
        participants: [
          { user_id: user.id, type: 'user' },
          { persona_id: persona.id, type: 'persona' }
        ],
        session_type: 'video_call',
        is_active: true
      }).select().single();

      if (error) throw error;

      setIsCallActive(true);
      onCallStateChange(true);

      toast({
        title: "Call Started",
        description: `Connected with ${persona.name}`,
      });

      // Speak welcome message
      await speak(`Hello! I'm ${persona.name}. How can I assist you today?`, {
        voice: persona.voice_style,
        language: persona.language || 'en'
      });

    } catch (error: any) {
      console.error('Error starting call:', error);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      toast({
        title: "Call Error",
        description: error.message || "Failed to start call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('tavus_sessions')
        .update({ 
          status: 'ended',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_active', true);

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
        description: error.message || "Failed to end call",
        variant: "destructive",
      });
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
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

  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {isCallActive && (
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMute}
            className="bg-black/50 hover:bg-black/70"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-white" />
            )}
          </Button>
        )}
      </div>

      <CallControls
        isCallActive={isCallActive}
        isLoading={isLoading}
        isRecording={isRecording}
        onStartCall={startCall}
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