import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Trash, 
  Edit, 
  Video,
  Loader2, 
  Upload 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PersonaListProps {
  personas: any[];
  onSelect: (persona: any) => void;
  onDelete: (id: string) => void;
  onDeploy: (id: string) => void;
  onEdit: (persona: any) => void;
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
  const [localPersonas, setLocalPersonas] = useState(personas);
  const [showAllPersonas, setShowAllPersonas] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);

  useEffect(() => {
    setLocalPersonas(personas);
  }, [personas]);

  const handleStartVideoCall = (personaId: string) => {
    navigate(`/video-call/${personaId}`);
  };

  const handleEdit = (persona: any) => {
    setIsEditing(true);
    setEditingPersona(persona);
    onEdit(persona);
  };

  const handleDeploy = async (personaId: string) => {
    await onDeploy(personaId);
    setEditingPersona(null);
  };

  const handleRedeploy = async (personaId: string) => {
    await onDeploy(personaId);
    setEditingPersona(null);
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(persona)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {persona.status === 'ready' && (
                    <DropdownMenuItem onClick={() => handleStartVideoCall(persona.id)}>
                      <Video className="mr-2 h-4 w-4" />
                      Start Video Call
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(persona.id)}
                    className="text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  onClick={() => handleDeploy(persona.id)}
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
                  onClick={() => handleRedeploy(persona.id)}
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeploying...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Redeploy
                    </>
                  )}
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