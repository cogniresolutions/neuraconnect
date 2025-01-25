import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import VideoCallInterface from '@/components/VideoCallInterface';
import { ConsentDialog } from './video/ConsentDialog';

const VideoCall = () => {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [persona, setPersona] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const loadPersona = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading persona with ID:', personaId);
        
        if (!personaId) {
          throw new Error('No persona ID provided');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data: existingPersona, error: personaError } = await supabase
          .from('personas')
          .select(`
            *,
            persona_appearances (*)
          `)
          .eq('id', personaId)
          .single();

        if (personaError) throw personaError;
        if (!existingPersona) throw new Error('Persona not found');

        console.log('Loaded persona:', existingPersona);
        setPersona(existingPersona);

        // Initialize video call session
        const { error: sessionError } = await supabase.functions.invoke('azure-video-chat', {
          body: {
            action: 'initialize',
            personaId: existingPersona.id,
            personaConfig: {
              name: existingPersona.name,
              voice: existingPersona.voice_style,
              personality: existingPersona.personality,
              skills: existingPersona.skills || [],
              topics: existingPersona.topics || []
            }
          }
        });

        if (sessionError) throw sessionError;

      } catch (error: any) {
        console.error('Error loading persona:', error);
        setError(error.message);
        
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

    return () => {
      const cleanup = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.functions.invoke('azure-video-chat', {
            body: {
              action: 'end',
              userId: user.id
            }
          });
        }
      };
      cleanup();
    };
  }, [personaId, toast]);

  const handleSpeakingChange = (speaking: boolean) => {
    console.log('Speaking state changed:', speaking);
  };

  const handleStartCall = () => {
    setShowConsent(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="container mx-auto p-4 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle>{error ? "Error" : "Persona Not Found"}</CardTitle>
              <CardDescription>
                {error || "The requested persona could not be found or you don't have access to it."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(-1)}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background">
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

      <VideoCallInterface
        persona={persona}
        onSpeakingChange={handleSpeakingChange}
        onCallStateChange={(isActive) => {
          console.log('Call state changed:', isActive);
          if (isActive) {
            toast({
              title: "Call Started",
              description: `Connected to video call with ${persona.name}`,
            });
          } else {
            toast({
              title: "Call Ended",
              description: "The video call has been disconnected",
            });
          }
        }}
      />

      <ConsentDialog
        open={showConsent}
        onOpenChange={setShowConsent}
        onAccept={() => {
          setShowConsent(false);
          // Start the call after consent
        }}
        personaName={persona.name}
      />
    </div>
  );
};

export default VideoCall;
