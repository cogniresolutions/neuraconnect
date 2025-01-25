import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { DeletePersonaDialog } from "./DeletePersonaDialog";
import { PersonaCardContent } from "./PersonaCardContent";
import type { Persona } from "@/types/persona";

interface PersonaCardProps {
  persona: Persona;
  onStartVideoCall: (personaId: string) => Promise<void>;
  onDeploy: (personaId: string) => Promise<void>;
  onDelete: (personaId: string) => Promise<void>;
  isDeploying: boolean;
}

export const PersonaCard = ({
  persona,
  onStartVideoCall,
  onDeploy,
  onDelete,
  isDeploying
}: PersonaCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(persona.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <PersonaCardContent
          persona={persona}
          onStartVideoCall={onStartVideoCall}
          onDeploy={onDeploy}
          isDeploying={isDeploying}
        />
        <DeletePersonaDialog
          personaId={persona.id}
          personaName={persona.name}
          onDelete={handleDelete}
        />
      </div>
    </Card>
  );
};