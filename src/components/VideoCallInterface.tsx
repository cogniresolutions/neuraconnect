import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { cleanupUserSessions } from '@/utils/sessionCleanup';
import { analyzeVideoFrame } from '@/utils/videoAnalysis';
import { Button } from './ui/button';
import { Loader2, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface VideoCallInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
  onCallStateChange?: (isActive: boolean) => void;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  persona,
  onSpeakingChange,
  onCallStateChange
}) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);

  const startCall = async () => {
    try {
      setIsInitializing(true);
      console.log('Starting new video call session...');
      
      // Initialize local video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize chat and audio connection
      chatRef.current = new RealtimeChat(async (event) => {
        if (event.type === 'response.audio.delta') {
          onSpeakingChange(true);
        } else if (event.type === 'response.audio.done') {
          onSpeakingChange(false);
        }
      });

      await chatRef.current.init(persona);

      // Create video call session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: sessionError } = await supabase.from('tavus_sessions').insert({
        conversation_id: crypto.randomUUID(),
        user_id: user.id,
        status: 'active',
        video_call_id: crypto.randomUUID(),
        participants: [
          { user_id: user.id, type: 'user' },
          { persona_id: persona.id, type: 'persona' }
        ],
        is_active: true,
        session_type: 'video_call'
      });

      if (sessionError) throw sessionError;

      setIsCallActive(true);
      onCallStateChange?.(true);

      // Initialize remote video if persona has video_url
      if (persona.video_url && remoteVideoRef.current) {
        remoteVideoRef.current.src = persona.video_url;
        await remoteVideoRef.current.play();
      }

      toast({
        title: "Call Started",
        description: `You're now in a call with ${persona.name}`,
      });
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const endCall = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await cleanupUserSessions(user.id);
      }

      setIsCallActive(false);
      onCallStateChange?.(false);
      onSpeakingChange(false);

      toast({
        title: "Call Ended",
        description: "The video call has been disconnected",
      });
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        title: "Error",
        description: "Error ending call. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Local Video */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={persona?.profile_picture_url} />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">You</span>
          </div>
        </div>

        {/* Remote Video (Persona) */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            loop
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={persona?.profile_picture_url} />
              <AvatarFallback>{persona?.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{persona?.name}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {!isCallActive ? (
          <Button
            onClick={startCall}
            disabled={isInitializing}
            className="bg-green-500 hover:bg-green-600"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Start Call
              </>
            )}
          </Button>
        ) : (
          <>
            <Button onClick={toggleAudio} variant="outline">
              {isAudioEnabled ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4 text-red-500" />
              )}
            </Button>
            <Button onClick={toggleVideo} variant="outline">
              {isVideoEnabled ? (
                <Video className="w-4 h-4" />
              ) : (
                <VideoOff className="w-4 h-4 text-red-500" />
              )}
            </Button>
            <Button onClick={endCall} variant="destructive">
              <VideoOff className="w-4 h-4 mr-2" />
              End Call
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCallInterface;