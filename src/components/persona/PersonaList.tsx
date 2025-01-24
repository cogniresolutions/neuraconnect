import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  PlayCircle,
  Edit2,
  Trash2,
  ServerIcon,
  List,
  RefreshCw,
  Video,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VOICE_MAPPINGS } from "@/constants/voices";
import { useNavigate } from 'react-router-dom';

type Persona = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  voice_style: string;
  updated_at: string;
};

export const PersonaList = ({
  personas: initialPersonas,
  onDeploy,
  onDelete,
  onEdit,
  onSelect,
  isDeploying,
}: {
  personas: Persona[];
  onDeploy: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (persona: Persona) => void;
  onSelect: (persona: Persona) => void;
  isDeploying: boolean;
}) => {
  const [selectedVideoPersona, setSelectedVideoPersona] = useState<Persona | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [localPersonas, setLocalPersonas] = useState<Persona[]>(initialPersonas);
  const [showAllPersonas, setShowAllPersonas] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Update local personas when initialPersonas changes
  useEffect(() => {
    setLocalPersonas(initialPersonas);
  }, [initialPersonas]);

  const handleDelete = async (personaId: string) => {
    try {
      setIsDeleting(true);
      setDeleteProgress(10);
      console.log('Starting deletion process for persona:', personaId);

      // Remove from local state immediately for better UX
      setLocalPersonas(prevPersonas => {
        console.log('Removing persona from local state:', personaId);
        return prevPersonas.filter(p => p.id !== personaId);
      });

      // Call the onDelete prop
      await onDelete(personaId);

      toast({
        title: "Success",
        description: "Persona and all associated data deleted successfully",
      });

    } catch (error: any) {
      console.error('Delete persona error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete persona",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  const handleDeploy = async (persona: Persona) => {
    try {
      await onDeploy(persona.id);
      toast({
        title: "Success",
        description: "Deployment initiated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deploy persona",
        variant: "destructive",
      });
    }
  };

  const handleRedeploy = async (persona: Persona) => {
    try {
      await onDeploy(persona.id);
      toast({
        title: "Success",
        description: "Redeployment initiated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to redeploy persona",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!editingPersona) return;

    try {
      await onEdit(editingPersona);
      toast({
        title: "Success",
        description: "Persona updated successfully",
      });
      setIsEditing(false);
      setEditingPersona(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update persona",
        variant: "destructive",
      });
    }
  };

  const allVoices = Object.values(VOICE_MAPPINGS).flatMap(
    language => [...language.male, ...language.female]
  ).map(voice => voice.replace('Neural', ''));

  const createdPersonas = localPersonas.filter(p => p.status === 'ready');
  const deployedPersonas = localPersonas.filter(p => p.status === 'deployed');

  const handleVideoCall = (personaId: string) => {
    navigate(`/video-call/${personaId}`);
  };

  // ... keep existing code (JSX rendering part remains the same)

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={() => setShowAllPersonas(!showAllPersonas)}
          className="bg-gray-700 hover:bg-gray-600"
        >
          <List className="h-4 w-4 mr-2" />
          {showAllPersonas ? "Show Created Only" : "Show All Personas"}
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 cursor-pointer" />
          <h2 className="text-xl font-semibold text-white">
            {showAllPersonas ? "All Personas" : "Created Personas"}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {createdPersonas.map((persona) => (
            <Card key={persona.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">{persona.name}</CardTitle>
                  <Badge variant="outline" className="bg-gray-700/50 text-gray-300">
                    ID: {persona.id}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  {persona.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500"
                    onClick={() => handleVideoCall(persona.id)}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                  <Dialog open={isEditing && editingPersona?.id === persona.id} onOpenChange={(open) => {
                    setIsEditing(open);
                    if (!open) setEditingPersona(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-600"
                        onClick={() => setEditingPersona(persona)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Edit Persona</DialogTitle>
                        <DialogDescription>
                          Make changes to your persona here.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Input
                          value={editingPersona?.name || ''}
                          onChange={(e) => setEditingPersona(prev => prev ? {...prev, name: e.target.value} : null)}
                          placeholder="Name"
                          className="bg-gray-700 border-gray-600"
                        />
                        <Textarea
                          value={editingPersona?.description || ''}
                          onChange={(e) => setEditingPersona(prev => prev ? {...prev, description: e.target.value} : null)}
                          placeholder="Description"
                          className="bg-gray-700 border-gray-600"
                        />
                        <Select 
                          value={editingPersona?.voice_style} 
                          onValueChange={(value) => setEditingPersona(prev => prev ? {...prev, voice_style: value} : null)}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600">
                            <SelectValue placeholder="Select voice style" />
                          </SelectTrigger>
                          <SelectContent>
                            {allVoices.map((voice) => (
                              <SelectItem key={voice} value={voice}>
                                {voice}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleEdit} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-800 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the persona and all associated data including training materials, videos, and API keys. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(persona.id)}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {persona.status === 'ready' && (
                    <Button
                      onClick={() => handleDeploy(persona)}
                      disabled={isDeploying}
                      size="sm"
                      className="ml-auto bg-blue-600 hover:bg-blue-700"
                    >
                      {isDeploying ? (
                        <ServerIcon className="h-4 w-4 animate-pulse" />
                      ) : (
                        <>
                          <ServerIcon className="h-4 w-4 mr-2" />
                          Deploy
                        </>
                      )}
                    </Button>
                  )}

                  {persona.status === 'deployed' && (
                    <Button
                      onClick={() => handleRedeploy(persona)}
                      disabled={isDeploying}
                      size="sm"
                      className="ml-auto bg-purple-600 hover:bg-purple-700"
                    >
                      {isDeploying ? (
                        <RefreshCw className="h-4 w-4 animate-pulse" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Redeploy
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {!showAllPersonas && deployedPersonas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Deployed Personas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deployedPersonas.map((persona) => (
              <Card key={persona.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">{persona.name}</CardTitle>
                    <Badge variant="outline" className="bg-gray-700/50 text-gray-300">
                      ID: {persona.id}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-300">
                    {persona.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the deployed persona and all associated data including training materials, videos, and API keys. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDelete(persona.id)}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      onClick={() => handleRedeploy(persona)}
                      disabled={isDeploying}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isDeploying ? (
                        <RefreshCw className="h-4 w-4 animate-pulse" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Redeploy
                        </>
                      )}
                    </Button>
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
