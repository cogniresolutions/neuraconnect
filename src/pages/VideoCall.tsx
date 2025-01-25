import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VideoCallInterface from '@/components/VideoCallInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const VideoCall = () => {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [persona, setPersona] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Check for authentication
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (!currentSession) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access video calls",
          variant: "destructive",
        });
        navigate('/auth', { state: { returnUrl: `/video-call/${personaId}` } });
      }
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, personaId, toast]);

  useEffect(() => {
    const loadPersona = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading persona with ID:', personaId);
        
        if (!personaId) {
          throw new Error('No persona ID provided');
        }

        if (!session?.user) {
          console.log('No authenticated user found');
          return; // Early return if no session
        }

        // Load persona with appearances
        const { data: existingPersona, error: personaError } = await supabase
          .from('personas')
          .select(`
            *,
            persona_appearances (*)
          `)
          .eq('id', personaId)
          .single();

        if (personaError) {
          throw personaError;
        }

        if (!existingPersona) {
          throw new Error('Persona not found');
        }

        console.log('Loaded persona:', existingPersona);
        setPersona(existingPersona);

        // Create or update video call session
        const { error: sessionError } = await supabase.functions.invoke('video-call', {
          body: {
            action: 'start',
            personaId: existingPersona.id,
            userId: session.user.id,
            personaConfig: {
              name: existingPersona.name,
              voice: existingPersona.voice_style,
              personality: existingPersona.personality
            }
          }
        });

        if (sessionError) {
          throw sessionError;
        }

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

    if (session?.user) {
      loadPersona();
    }

    // Cleanup function
    return () => {
      const cleanup = async () => {
        if (session?.user) {
          await supabase.functions.invoke('video-call', {
            body: {
              action: 'end',
              userId: session.user.id
            }
          });
        }
      };
      cleanup();
    };
  }, [personaId, toast, session]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    </div>
  );
};

export default VideoCall;