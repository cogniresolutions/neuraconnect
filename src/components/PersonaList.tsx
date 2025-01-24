import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "./persona/PersonaCard";
import type { Persona } from "@/types/persona";

interface PersonaListProps {
  personas: Persona[];
  onSelect: (persona: Persona) => void;
  onDelete: (id: string) => void;
  onDeploy: (id: string) => void;
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

  const handleDelete = async (personaId: string) => {
    try {
      console.log('Starting deletion process for persona:', personaId);
      
      const startTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('delete-persona', {
        body: { personaId }
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (error) throw error;

      console.log('Deletion response:', data);
      
      onDelete(personaId);
      toast({
        title: "Success",
        description: "Persona deleted successfully",
      });

      await supabase.from('api_monitoring').insert({
        endpoint: 'delete-persona',
        status: 'success',
        response_time: responseTime,
      });

    } catch (error: any) {
      console.error('Error deleting persona:', error);
      
      await supabase.from('api_monitoring').insert({
        endpoint: 'delete-persona',
        status: 'error',
        error_message: error.message,
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete persona",
      });
    }
  };

  const displayedPersonas = showAllPersonas ? localPersonas : localPersonas.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedPersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onStartVideoCall={handleStartVideoCall}
            onDeploy={onDeploy}
            onDelete={handleDelete}
            isDeploying={isDeploying}
          />
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