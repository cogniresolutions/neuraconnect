import { useState } from 'react';
import { Video, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DeletePersonaDialog } from "./DeletePersonaDialog";
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
          isDeleting={isDeleting}
          onConfirmDelete={handleDelete}
        />
      </div>

      <CardContent>
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
              onClick={() => onStartVideoCall(persona.id)}
              disabled={persona.status !== 'ready'}
            >
              <Video className="mr-2 h-4 w-4" />
              Video Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};