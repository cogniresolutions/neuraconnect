import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Trash2, Edit2, Phone, Video } from "lucide-react";
import VideoCallInterface from "@/components/VideoCallInterface";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface Persona {
  id: string;
  name: string;
  description: string | null;
  status: string;
  voice_style?: string | null;
  emotion_settings?: Json;
  avatar_url?: string | null;
  avatar_model_url?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  environment_analysis?: boolean;
  facial_expressions?: Json;
  model_config?: Json;
  personality?: string | null;
  profile_picture_url?: string | null;
  requires_training_video?: boolean;
  skills?: Json;
  topics?: string[] | null;
  training_materials?: Json;
  last_analyzed_at?: string | null;
}

interface PersonaListProps {
  personas: Persona[];
  onDeploy: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (persona: Persona) => void;
  onSelect: (persona: Persona) => void;
  isDeploying: boolean;
}

export const PersonaList = ({
  personas,
  onDeploy,
  onDelete,
  onEdit,
  onSelect,
  isDeploying,
}: PersonaListProps) => {
  const [selectedVideoPersona, setSelectedVideoPersona] = useState<Persona | null>(null);
  const { toast } = useToast();

  // Use React Query to fetch personas
  const { data: fetchedPersonas, isLoading } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          title: "Error fetching personas",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      return data as Persona[];
    },
  });

  const allPersonas = fetchedPersonas || personas;
  const createdPersonas = allPersonas.filter(p => p.status === 'ready');
  const deployedPersonas = allPersonas.filter(p => p.status === 'deployed');

  if (isLoading) {
    return <div>Loading personas...</div>;
  }

  return (
    <div className="space-y-6">
      {selectedVideoPersona && (
        <VideoCallInterface
          persona={selectedVideoPersona}
          onSpeakingChange={(speaking: boolean) => {
            console.log('Speaking state changed:', speaking);
          }}
          onCallStateChange={(isActive) => {
            if (!isActive) {
              setSelectedVideoPersona(null);
            }
          }}
        />
      )}

      {createdPersonas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Created Personas</h2>
          <div className="grid gap-4">
            {createdPersonas.map((persona) => (
              <Card key={persona.id} className="bg-white/5 border-0">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white">{persona.name}</h3>
                      <p className="text-sm text-gray-400">{persona.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(persona)}
                        className="text-purple-400 border-purple-400/30"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeploy(persona.id)}
                        disabled={isDeploying}
                        className="text-green-400 border-green-400/30"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(persona)}
                        className="text-blue-400 border-blue-400/30"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVideoPersona(persona)}
                        className="text-indigo-400 border-indigo-400/30"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(persona.id)}
                        className="text-red-400 border-red-400/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {deployedPersonas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Deployed Personas</h2>
          <div className="grid gap-4">
            {deployedPersonas.map((persona) => (
              <Card key={persona.id} className="bg-white/5 border-0">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white">{persona.name}</h3>
                      <p className="text-sm text-gray-400">{persona.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVideoPersona(persona)}
                        className="text-indigo-400 border-indigo-400/30"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(persona)}
                        className="text-blue-400 border-blue-400/30"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(persona.id)}
                        className="text-red-400 border-red-400/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};