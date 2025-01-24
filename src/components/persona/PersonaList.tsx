import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Trash2, Edit2, Phone, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Persona {
  id: string;
  name: string;
  description: string | null;
  status: string;
  voice_style?: string | null;
  emotion_settings?: {
    sensitivity: number;
    response_delay: number;
  };
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
  const navigate = useNavigate();
  const createdPersonas = personas.filter(p => p.status === 'ready');
  const deployedPersonas = personas.filter(p => p.status === 'deployed');

  const handleVideoCall = (personaId: string) => {
    navigate(`/video-call/${personaId}`);
  };

  return (
    <div className="space-y-6">
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
                        onClick={() => handleVideoCall(persona.id)}
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
                        onClick={() => handleVideoCall(persona.id)}
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