import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Loader2, Mic, MicOff, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VOICE_MAPPINGS } from '@/constants/voices';
import { supabase } from '@/integrations/supabase/client';
import { logAPIUsage, handleAPIError, measureResponseTime } from '@/utils/errorHandling';

interface AIVideoInterfaceProps {
  persona: any;
  onSpeakingChange: (speaking: boolean) => void;
}

const AIVideoInterface: React.FC<AIVideoInterfaceProps> = ({ persona, onSpeakingChange }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const chatRef = useRef<RealtimeChat | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const initializeAudioContext = async () => {
    try {
      console.log('Initializing audio context...');
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({
          sampleRate: 44100,
          latencyHint: 'interactive'
        });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('Audio context resumed:', audioContextRef.current.state);
      }

      return audioContextRef.current;
    } catch (error) {
      console.error('Error initializing audio context:', error);
      throw error;
    }
  };

  const playNextAudio = async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0 || isPlayingRef.current) {
      return;
    }

    try {
      const audioContext = await initializeAudioContext();
      isPlayingRef.current = true;
      
      const audioBuffer = audioQueueRef.current.shift();
      if (!audioBuffer) return;

      console.log('Playing audio buffer:', {
        duration: audioBuffer.duration,
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        console.log('Audio playback completed');
        playNextAudio();
      };

      source.start(0);
      console.log('Started playing audio buffer');
    } catch (error) {
      console.error('Error playing audio:', error);
      isPlayingRef.current = false;
    }
  };

  const handleMessage = async (event: any) => {
    console.log('Received WebSocket message:', event);
    
    if (event.type === 'response.audio.delta') {
      console.log('Received audio delta, persona is speaking');
      onSpeakingChange(true);
      
      if (event.audio) {
        try {
          const audioData = atob(event.audio);
          const arrayBuffer = new ArrayBuffer(audioData.length);
          const view = new Uint8Array(arrayBuffer);
          for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
          }
          
          if (!audioContextRef.current) {
            await initializeAudioContext();
          }
          
          const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
          audioQueueRef.current.push(audioBuffer);
          await playNextAudio();
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Audio Error",
            description: "Failed to process audio response",
            variant: "destructive",
          });
        }
      }
    } else if (event.type === 'response.audio.done') {
      console.log('Audio response completed, persona stopped speaking');
      onSpeakingChange(false);
    } else if (event.type === 'response.text') {
      if (selectedLanguage !== 'en-US') {
        const targetLanguage = selectedLanguage.split('-')[0];
        const { data, error } = await supabase.functions.invoke('azure-translate', {
          body: { 
            text: event.content, 
            targetLanguage 
          }
        });

        if (!error && data) {
          event.content = data.translatedText;
        }
      }
    }
  };

  const startConversation = async () => {
    const getMeasureTime = measureResponseTime();
    
    try {
      setIsLoading(true);
      console.log('Initializing chat with persona:', persona);
      
      // Initialize audio context first
      await initializeAudioContext();
      
      // Initialize audio with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      console.log('Audio stream initialized:', stream.getAudioTracks()[0].getSettings());
      streamRef.current = stream;
      
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init({
        ...persona,
        language: selectedLanguage,
        voice: VOICE_MAPPINGS[selectedLanguage as keyof typeof VOICE_MAPPINGS]?.male[0]
      });
      
      const responseTime = getMeasureTime();
      await logAPIUsage('start-conversation', 'success', undefined, responseTime);
      
      setIsConnected(true);
      console.log('WebSocket connection established successfully');
      
      toast({
        title: "Connected",
        description: `${persona.name} is ready to chat`,
      });
    } catch (error: any) {
      const responseTime = getMeasureTime();
      await logAPIUsage('start-conversation', 'error', error, responseTime);
      handleAPIError(error, 'Starting conversation');
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = async () => {
    const getMeasureTime = measureResponseTime();
    
    try {
      console.log('Ending conversation and cleaning up connections');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      chatRef.current?.disconnect();
      
      const responseTime = getMeasureTime();
      await logAPIUsage('end-conversation', 'success', undefined, responseTime);
      
      setIsConnected(false);
      onSpeakingChange(false);
    } catch (error: any) {
      const responseTime = getMeasureTime();
      await logAPIUsage('end-conversation', 'error', error, responseTime);
      handleAPIError(error, 'Ending conversation');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg backdrop-blur-sm">
        <Select
          value={selectedLanguage}
          onValueChange={setSelectedLanguage}
          disabled={isConnected}
        >
          <SelectTrigger className="w-[180px]">
            <Globe className="mr-2 h-4 w-4" />
            {selectedLanguage}
          </SelectTrigger>
          <SelectContent>
            {Object.keys(VOICE_MAPPINGS).map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isConnected && (
          <Button
            onClick={toggleMute}
            variant="secondary"
            size="sm"
            className="bg-black/50 hover:bg-black/70"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-white" />
            )}
          </Button>
        )}
        
        {!isConnected ? (
          <Button 
            onClick={startConversation}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Conversation
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={endConversation}
            variant="secondary"
          >
            <MicOff className="mr-2 h-4 w-4" />
            End Conversation
          </Button>
        )}
      </div>
    </div>
  );
};

export default AIVideoInterface;
