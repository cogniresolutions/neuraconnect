import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Trash2, Edit2, Loader2 } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  description: string | null;
  status: string;
  voice_style?: string | null;
}

interface PersonaListProps {
  personas: Persona[];
  isLoading: boolean;
  onDeploy: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (persona: Persona) => void;
}

export const PersonaList = ({
  personas,
  isLoading,
  onDeploy,
  onDelete,
  onEdit,
}: PersonaListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No personas created yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {personas.map((persona) => (
        <Card key={persona.id} className="bg-white/5 border-0">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white">{persona.name}</h3>
                <p className="text-sm text-gray-400">{persona.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(persona)}
                  className="text-purple-400 border-purple-400/30"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {persona.status !== 'deployed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeploy(persona.id)}
                    className="text-green-400 border-green-400/30"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(persona.id)}
                  className="text-red-400 border-red-400/30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm">
                <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                  persona.status === 'deployed' 
                    ? 'bg-green-400/20 text-green-400' 
                    : 'bg-gray-400/20 text-gray-400'
                }`}>
                  {persona.status === 'deployed' ? 'Deployed' : 'Ready'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};