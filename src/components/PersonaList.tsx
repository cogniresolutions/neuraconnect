import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  PlayCircle,
  Edit2,
  Trash2,
  ServerIcon,
  List,
  RefreshCw,
  Video,
  Loader2,
  Upload,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VOICE_MAPPINGS } from "@/constants/voices";

type Persona = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  voice_style: string;
  updated_at: string;
  profile_picture_url?: string;
};

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
  const [isEditing, setIsEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLocalPersonas(personas);
  }, [personas]);

  const handleStartVideoCall = (personaId: string) => {
    navigate(`/video-call/${personaId}`);
  };

  const handleEdit = (persona: Persona) => {
    setIsEditing(true);
    setEditingPersona(persona);
    onEdit(persona);
  };

  const handleDeploy = async (personaId: string) => {
    await onDeploy(personaId);
    setEditingPersona(null);
  };

  const handleDelete = async (personaId: string) => {
    setIsDeleting(true);
    try {
      console.log('Starting deletion process for persona:', personaId);
      
      const { data, error } = await supabase.functions.invoke('delete-persona', {
        body: { personaId }
      });

      if (error) throw error;

      console.log('Deletion response:', data);
      
      onDelete(personaId);
      toast({
        title: "Success",
        description: "Persona deleted successfully",
      });

      // Add to notification center
      const { error: notificationError } = await supabase
        .from('api_monitoring')
        .insert({
          endpoint: 'delete-persona',
          status: 'success',
          error_message: null,
          response_time: 0,
        });

      if (notificationError) {
        console.error('Error logging deletion:', notificationError);
      }

    } catch (error: any) {
      console.error('Error deleting persona:', error);
      
      // Log error to notification center
      const { error: notificationError } = await supabase
        .from('api_monitoring')
        .insert({
          endpoint: 'delete-persona',
          status: 'error',
          error_message: error.message,
          response_time: 0,
        });

      if (notificationError) {
        console.error('Error logging deletion error:', notificationError);
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete persona",
      });
    } finally {
      setIsDeleting(false);
    }
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
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the persona and all associated data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(persona.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                    onClick={() => handleStartVideoCall(persona.id)}
                    disabled={persona.status !== 'ready'}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Video Call
                  </Button>
                )}
              </div>
            </CardContent>
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

