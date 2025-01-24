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

  useEffect(() => {
    const loadPersona = async () => {
      try {
        setIsLoading(true);
        console.log('Loading persona with ID:', personaId);
        
        const startTime = performance.now();
        
        if (personaId) {
          const { data: existingPersona, error } = await supabase
            .from('personas')
            .select('*, persona_appearances(*)')
            .eq('id', personaId)
            .single();

          const endTime = performance.now();
          const responseTime = Math.round(endTime - startTime);

          if (!error && existingPersona) {
            console.log('Loaded persona:', existingPersona);
            setPersona(existingPersona);
            
            // Log successful load
            await supabase.from('api_monitoring').insert({
              endpoint: 'load-persona',
              status: 'success',
              response_time: responseTime,
            });
            
            return;
          }
          
          if (error) {
            console.error('Error loading persona:', error);
            
            // Log error
            await supabase.from('api_monitoring').insert({
              endpoint: 'load-persona',
              status: 'error',
              error_message: error.message,
              response_time: responseTime,
            });
            
            toast({
              title: "Error",
              description: "Failed to load persona details",
              variant: "destructive",
            });
          }
        }

        setPersona(null);
        
      } catch (error: any) {
        console.error('Error loading persona:', error);
        
        // Log error
        await supabase.from('api_monitoring').insert({
          endpoint: 'load-persona',
          status: 'error',
          error_message: error.message,
        });
        
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="container mx-auto p-4 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle>Persona Not Found</CardTitle>
              <CardDescription>
                The requested persona could not be found or you don't have access to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(-1)}
                className="w-full"
              >
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VideoCallInterface
          persona={persona}
          onSpeakingChange={handleSpeakingChange}
          onCallStateChange={(isActive) => {
            console.log('Call state changed:', isActive);
          }}
        />
      </div>
    </div>
  );
};

export default VideoCall;