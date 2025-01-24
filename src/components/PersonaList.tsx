import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, Upload, Loader2 } from "lucide-react";
import { DeletePersonaDialog } from './persona/DeletePersonaDialog';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Persona } from "@/types/persona";

interface PersonaListProps {
  personas: Persona[];
  onSelect: (persona: Persona) => void;
  onDelete: (id: string) => Promise<void>;
  onDeploy: (id: string) => Promise<void>;
  onEdit: (persona: Persona) => void;
  isDeploying: boolean;
}

export const PersonaList = ({
  personas,
  onSelect,
  onDelete,
  onDeploy,
  onEdit,
  isDeploying
}: PersonaListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [localPersonas, setLocalPersonas] = useState(personas);
  const [showAllPersonas, setShowAllPersonas] = useState(false);

  useEffect(() => {
    setLocalPersonas(personas);
  }, [personas]);

  const handleStartVideoCall = async (personaId: string) => {
    try {
      const startTime = performance.now();
      
      const { data: session, error: sessionError } = await supabase.functions.invoke('video-call', {
        body: { 
          action: 'start',
          personaId,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (sessionError) throw sessionError;

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      await supabase.from('api_monitoring').insert({
        endpoint: 'video-call',
        status: 'success',
        response_time: responseTime,
      });

      navigate(`/video-call/${personaId}`);
    } catch (error: any) {
      console.error('Error starting video call:', error);
      
      await supabase.from('api_monitoring').insert({
        endpoint: 'video-call',
        status: 'error',
        error_message: error.message,
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start video call. Please try again.",
      });
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    await onDelete(personaId);
    setLocalPersonas(prevPersonas => prevPersonas.filter(p => p.id !== personaId));
  };

  const displayedPersonas = showAllPersonas ? localPersonas : localPersonas.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedPersonas.map((persona) => (
          <Card key={persona.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  {persona.profile_picture_url ? (
                    <AvatarImage src={persona.profile_picture_url} alt={persona.name} />
                  ) : (
                    <AvatarFallback>{persona.name[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold">{persona.name}</h3>
                  <p className="text-sm text-gray-500">{persona.description}</p>
                </div>
              </div>
              <DeletePersonaDialog
                personaId={persona.id}
                personaName={persona.name}
                onDelete={() => handleDeletePersona(persona.id)}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Badge
                variant={persona.status === 'ready' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {persona.status}
              </Badge>
              {persona.status === 'draft' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeploy(persona.id)}
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Deploy
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartVideoCall(persona.id)}
                  disabled={persona.status !== 'ready'}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Video Call
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      {localPersonas.length > 3 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAllPersonas(!showAllPersonas)}
        >
          {showAllPersonas ? 'Show Less' : 'Show All'}
        </Button>
      )}
    </div>
  );
};