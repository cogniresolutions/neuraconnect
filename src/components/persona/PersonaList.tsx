import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Trash2, Edit2, Phone, Video } from "lucide-react";
import VideoCallInterface from "@/components/VideoCallInterface";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import { Progress } from "@/components/ui/progress";
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
  personas: initialPersonas,
  onDeploy,
  onDelete,
  onEdit,
  onSelect,
  isDeploying,
}: PersonaListProps) => {
  const [selectedVideoPersona, setSelectedVideoPersona] = useState<Persona | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [localPersonas, setLocalPersonas] = useState<Persona[]>(initialPersonas);
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

  const handleDelete = async (personaId: string) => {
    try {
      setIsDeleting(true);
      setDeleteProgress(10);
      console.log('Deleting persona:', personaId);

      // Get all training materials to delete from storage
      const { data: trainingMaterials } = await supabase
        .from('persona_training_materials')
        .select('file_path')
        .eq('persona_id', personaId);

      setDeleteProgress(20);

      // Delete training materials from storage
      if (trainingMaterials?.length) {
        const { error: storageError } = await supabase.storage
          .from('training_materials')
          .remove(trainingMaterials.map(tm => tm.file_path));

        if (storageError) {
          console.error('Error deleting training materials from storage:', storageError);
          throw storageError;
        }
      }

      setDeleteProgress(30);

      // Get training videos to delete from storage
      const { data: trainingVideos } = await supabase
        .from('training_videos')
        .select('video_url, consent_url')
        .eq('persona_id', personaId);

      setDeleteProgress(40);

      // Delete training videos from storage
      if (trainingVideos?.length) {
        const videoUrls = trainingVideos.flatMap(tv => [tv.video_url, tv.consent_url].filter(Boolean));
        const { error: videoStorageError } = await supabase.storage
          .from('training_videos')
          .remove(videoUrls);

        if (videoStorageError) {
          console.error('Error deleting training videos from storage:', videoStorageError);
          throw videoStorageError;
        }
      }

      setDeleteProgress(50);

      // Get profile picture URL to delete from storage
      const { data: persona } = await supabase
        .from('personas')
        .select('profile_picture_url, avatar_url')
        .eq('id', personaId)
        .single();

      setDeleteProgress(60);

      // Delete profile pictures from storage if they exist
      if (persona?.profile_picture_url) {
        const { error: profilePicError } = await supabase.storage
          .from('persona_profiles')
          .remove([persona.profile_picture_url]);

        if (profilePicError) {
          console.error('Error deleting profile picture:', profilePicError);
          throw profilePicError;
        }
      }

      if (persona?.avatar_url) {
        const { error: avatarError } = await supabase.storage
          .from('persona_assets')
          .remove([persona.avatar_url]);

        if (avatarError) {
          console.error('Error deleting avatar:', avatarError);
          throw avatarError;
        }
      }

      setDeleteProgress(70);

      // Delete all related database records
      const { error: trainingError } = await supabase
        .from('persona_training_materials')
        .delete()
        .eq('persona_id', personaId);

      if (trainingError) {
        console.error('Error deleting training materials:', trainingError);
        throw trainingError;
      }

      setDeleteProgress(75);

      const { error: videosError } = await supabase
        .from('training_videos')
        .delete()
        .eq('persona_id', personaId);

      if (videosError) {
        console.error('Error deleting training videos:', videosError);
        throw videosError;
      }

      setDeleteProgress(80);

      const { error: emotionError } = await supabase
        .from('emotion_analysis')
        .delete()
        .eq('persona_id', personaId);

      if (emotionError) {
        console.error('Error deleting emotion analysis:', emotionError);
        throw emotionError;
      }

      setDeleteProgress(85);

      const { error: apiKeyError } = await supabase
        .from('api_keys')
        .delete()
        .eq('persona_id', personaId);

      if (apiKeyError) {
        console.error('Error deleting API keys:', apiKeyError);
        throw apiKeyError;
      }

      setDeleteProgress(90);

      const { error: appearanceError } = await supabase
        .from('persona_appearances')
        .delete()
        .eq('persona_id', personaId);

      if (appearanceError) {
        console.error('Error deleting persona appearances:', appearanceError);
        throw appearanceError;
      }

      setDeleteProgress(95);

      // Finally delete the persona
      const { error: personaError } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId);

      if (personaError) {
        console.error('Error deleting persona:', personaError);
        throw personaError;
      }

      setDeleteProgress(100);

      // Update local state to remove the deleted persona
      setLocalPersonas(prevPersonas => prevPersonas.filter(p => p.id !== personaId));
      
      // Call the onDelete prop to update parent state
      onDelete(personaId);

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

  // Use localPersonas instead of fetched personas for rendering
  const allPersonas = localPersonas;
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-400/30"
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
                          {isDeleting && deleteProgress > 0 && (
                            <div className="space-y-2 my-4">
                              <Progress value={deleteProgress} className="w-full" />
                              <p className="text-sm text-center text-gray-400">
                                Deleting persona... {deleteProgress}%
                              </p>
                            </div>
                          )}
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-400/30"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-800 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the deployed persona and all associated data including training materials, videos, and API keys. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          {isDeleting && deleteProgress > 0 && (
                            <div className="space-y-2 my-4">
                              <Progress value={deleteProgress} className="w-full" />
                              <p className="text-sm text-center text-gray-400">
                                Deleting persona... {deleteProgress}%
                              </p>
                            </div>
                          )}
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