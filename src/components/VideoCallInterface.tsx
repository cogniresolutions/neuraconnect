import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import LocalVideo from './video/LocalVideo';
import RemoteVideo from './video/RemoteVideo';
import VideoControls from './video/VideoControls';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);
  const mountedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Check and cleanup any hanging sessions on component mount
  useEffect(() => {
    const cleanupHangingSessions = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { error } = await supabase
          .from('tavus_sessions')
          .update({ 
            status: 'ended',
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error cleaning up hanging sessions:', error);
        }
      } catch (error) {
        console.error('Error in cleanupHangingSessions:', error);
      }
    };

    cleanupHangingSessions();
  }, []);

  const forceCleanup = async () => {
    console.log('Force cleaning up video call...');
    
    try {
      // Stop all media tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }

      // Close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Disconnect chat
      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Update session status in database if we have a session ID
      if (sessionIdRef.current) {
        const { error } = await supabase
          .from('tavus_sessions')
          .update({ 
            status: 'ended',
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionIdRef.current);

        if (error) {
          console.error('Error updating session status:', error);
        }
      }

      setStream(null);
      setIsCallActive(false);
      onCallStateChange?.(false);
      sessionIdRef.current = null;

      toast({
        title: "Call Ended",
        description: "The video call has been forcefully terminated",
      });

    } catch (error) {
      console.error('Error during force cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to completely clean up the call. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const cleanup = useCallback(() => {
    console.log('Running cleanup in VideoCallInterface');
    forceCleanup();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const startCamera = async () => {
    try {
      cleanup();

      // Create a new session
      const { data: session, error: sessionError } = await supabase
        .from('tavus_sessions')
        .insert({
          conversation_id: crypto.randomUUID(),
          user_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'active',
          is_active: true,
          session_type: 'video_call',
          participants: [
            { user_id: (await supabase.auth.getUser()).data.user?.id },
            { persona_id: persona.id }
          ]
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      sessionIdRef.current = session.id;

      // Initialize chat connection
      chatRef.current = new RealtimeChat((event) => {
        if (event.type === 'response.audio.delta') {
          onSpeakingChange(true);
        } else if (event.type === 'response.audio.done') {
          onSpeakingChange(false);
        }
      });

      await chatRef.current.init(persona);

      // Wait for video elements
      await new Promise<void>((resolve) => {
        const checkRefs = () => {
          if (localVideoRef.current && remoteVideoRef.current) {
            console.log('Video elements are ready');
            resolve();
          } else {
            console.log('Waiting for video elements...');
            setTimeout(checkRefs, 100);
          }
        };
        checkRefs();
      });

      console.log('Requesting media stream...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
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

      console.log('Setting up media stream...');
      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
        await localVideoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          throw error;
        });
      }

      // Initialize audio context
      audioContextRef.current = new AudioContext();
      
      setIsCallActive(true);
      onCallStateChange?.(true);
      
      toast({
        title: "Call Connected",
        description: `You're now in a call with ${persona.name}`,
      });

      console.log('Camera and audio initialized successfully');
    } catch (error) {
      console.error('Camera/audio initialization error:', error);
      cleanup();
      
      toast({
        title: "Connection Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      
      toast({
        title: isAudioEnabled ? "Microphone Muted" : "Microphone Unmuted",
        description: isAudioEnabled ? "Others cannot hear you" : "Others can now hear you",
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      
      toast({
        title: isVideoEnabled ? "Camera Off" : "Camera On",
        description: isVideoEnabled ? "Your camera is now off" : "Your camera is now on",
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <LocalVideo onVideoRef={(ref) => localVideoRef.current = ref} />
          </div>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <RemoteVideo onVideoRef={(ref) => remoteVideoRef.current = ref} />
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <VideoControls
            isCallActive={isCallActive}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            onStartCall={startCamera}
            onEndCall={cleanup}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallInterface;