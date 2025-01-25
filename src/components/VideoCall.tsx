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
  const [isCallStarted, setIsCallStarted] = useState(false);

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
  }, [personaId, toast]);

  const handleSpeakingChange = (speaking: boolean) => {
    console.log('Speaking state changed:', speaking);
  };

  const handleStartCall = async () => {
    try {
      // Initialize video call session
      const { error: sessionError } = await supabase.functions.invoke('azure-video-chat', {
        body: {
          action: 'initialize',
          personaId: persona.id,
          personaConfig: {
            name: persona.name,
            voice: persona.voice_style,
            personality: persona.personality,
            skills: persona.skills || [],
            topics: persona.topics || []
          }
        }
      });

      if (sessionError) throw sessionError;
      
      setShowConsent(true);
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to initialize video call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConsentAccepted = () => {
    setShowConsent(false);
    setIsCallStarted(true);
    toast({
      title: "Call Starting",
      description: "Initializing video call...",
    });
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

      {!isCallStarted ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Start Video Call</CardTitle>
            <CardDescription>
              Ready to start a video call with {persona.name}? Make sure your camera and microphone are working.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleStartCall}
              className="w-full"
            >
              Start Call
            </Button>
          </CardContent>
        </Card>
      ) : (
        <VideoCallInterface
          persona={persona}
          onSpeakingChange={handleSpeakingChange}
          onCallStateChange={(isActive) => {
            console.log('Call state changed:', isActive);
            if (!isActive) {
              setIsCallStarted(false);
              toast({
                title: "Call Ended",
                description: "The video call has been disconnected",
              });
            }
          }}
        />
      )}

      <ConsentDialog
        open={showConsent}
        onOpenChange={setShowConsent}
        onAccept={handleConsentAccepted}
        personaName={persona.name}
      />
    </div>
  );
};

export default VideoCall;