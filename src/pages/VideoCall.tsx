import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VideoCallInterface from '@/components/VideoCallInterface';
import AIPersonaVideo from '@/components/AIPersonaVideo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const VideoCall = () => {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [persona, setPersona] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPersona = async () => {
      if (!personaId) {
        navigate('/');
        return;
      }

      try {
        const { data: persona, error } = await supabase
          .from('personas')
          .select('*')
          .eq('id', personaId)
          .single();

        if (error) throw error;
        if (!persona) {
          toast({
            title: "Error",
            description: "Persona not found",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setPersona(persona);
      } catch (error: any) {
        console.error('Error loading persona:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPersona();
  }, [personaId, navigate, toast]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Video Call with {persona?.name}</h1>
      </div>

      {!isLoading && persona && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <AIPersonaVideo
              trainingVideoUrl={persona.video_url}
              expressionSegments={persona.facial_expressions}
            />
          </div>
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <VideoCallInterface
              persona={persona}
              onCallStateChange={(isActive) => {
                console.log('Call state changed:', isActive);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;