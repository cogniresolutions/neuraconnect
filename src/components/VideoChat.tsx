import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Video, VideoOff } from 'lucide-react';
import AIVideoInterface from './AIVideoInterface';
import { VideoCallInterface } from './VideoCallInterface';
import Avatar3D from './Avatar3D';

const VideoChat = () => {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [persona, setPersona] = useState<any>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const loadPersona = async () => {
      if (!personaId) {
        navigate('/create-persona');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .eq('id', personaId)
          .single();

        if (error) throw error;
        if (!data) {
          toast({
            title: "Error",
            description: "Persona not found",
            variant: "destructive",
          });
          navigate('/create-persona');
          return;
        }

        setPersona(data);
      } catch (error: any) {
        console.error('Error loading persona:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load persona",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPersona();
  }, [personaId, navigate, toast]);

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleSpeakingChange = (speaking: boolean) => {
    setIsSpeaking(speaking);
  };

  const handleCallStateChange = (isActive: boolean) => {
    // Additional logic for call state changes can be added here
    console.log('Call state changed:', isActive);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Video Chat with {persona?.name}</h1>
        <Button
          variant="outline"
          onClick={toggleVideo}
          className="bg-gray-700 text-white hover:bg-gray-600"
        >
          {isVideoEnabled ? (
            <>
              <VideoOff className="mr-2 h-4 w-4" />
              Disable Video
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Enable Video
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isVideoEnabled && (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <VideoCallInterface 
              persona={persona}
              onCallStateChange={handleCallStateChange}
            />
          </div>
        )}
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <Avatar3D 
            modelUrl={persona?.avatar_model_url} 
            isAnimating={isSpeaking}
          />
        </div>
      </div>

      <AIVideoInterface 
        persona={persona} 
        onSpeakingChange={handleSpeakingChange}
      />
    </div>
  );
};

export default VideoChat;
