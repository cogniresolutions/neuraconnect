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
  const externalVideoUrl = "https://tavus.video/943ec60143"; // Add the Tavus video URL

  useEffect(() => {
    const loadPersona = async () => {
      try {
        setIsLoading(true);
        
        // First try to load the specified persona
        if (personaId) {
          const { data: existingPersona, error } = await supabase
            .from('personas')
            .select('*')
            .eq('id', personaId)
            .single();

          if (!error && existingPersona) {
            setPersona(existingPersona);
            return;
          }
        }

        // If no persona found, create a test persona
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user?.id) {
          throw new Error('User not authenticated');
        }

        const testPersona = {
          name: 'Test Persona',
          description: 'A test persona for video call testing',
          voice_style: 'en-US-JennyNeural',
          personality: 'Friendly and helpful AI assistant',
          status: 'active',
          user_id: user.user.id,
          skills: ['conversation', 'video chat'],
          topics: ['general discussion', 'testing'],
          model_config: {
            model: 'gpt-4o-mini',
            max_tokens: 800,
            temperature: 0.7
          }
        };

        const { data: newPersona, error: createError } = await supabase
          .from('personas')
          .insert([testPersona])
          .select()
          .single();

        if (createError) throw createError;

        setPersona(newPersona);
        navigate(`/video-call/${newPersona.id}`);
        
        toast({
          title: "Test Persona Created",
          description: "A test persona has been created for video call testing.",
        });

      } catch (error: any) {
        console.error('Error loading/creating persona:', error);
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

  const handleSpeakingChange = (speaking: boolean) => {
    console.log('Speaking state changed:', speaking);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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

      {persona && (
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
              onSpeakingChange={handleSpeakingChange}
              onCallStateChange={(isActive) => {
                console.log('Call state changed:', isActive);
              }}
              externalVideoUrl={externalVideoUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;