import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Upload, Loader2 } from "lucide-react";
import type { Persona } from "@/types/persona";

interface PersonaCardContentProps {
  persona: Persona;
  onStartVideoCall: (personaId: string) => Promise<void>;
  onDeploy: (personaId: string) => Promise<void>;
  isDeploying: boolean;
}

export const PersonaCardContent = ({
  persona,
  onStartVideoCall,
  onDeploy,
  isDeploying
}: PersonaCardContentProps) => {
  return (
    <>
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
    </>
  );
};