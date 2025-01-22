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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  PlayCircle,
  Edit2,
  Trash2,
  ServerIcon,
} from "lucide-react";

type Persona = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  voice_style: string;
  updated_at: string;
};

export const PersonaList = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPersonas(data || []);
      } catch (error: any) {
        console.error('Fetch personas error:', error);
        toast({
          title: "Error",
          description: "Failed to load personas",
          variant: "destructive",
        });
      }
    };

    fetchPersonas();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personas'
        },
        () => {
          fetchPersonas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleDeploy = async (persona: Persona) => {
    setIsDeploying(true);
    try {
      const { error } = await supabase.functions.invoke('deploy-persona', {
        body: { personaId: persona.id }
      });

      if (error) throw error;

      toast({
        title: "Deployment Started",
        description: `${persona.name} is being deployed`,
      });
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleEdit = async () => {
    if (!editingPersona) return;

    try {
      const { error } = await supabase
        .from('personas')
        .update({
          name: editingPersona.name,
          description: editingPersona.description,
          voice_style: editingPersona.voice_style,
        })
        .eq('id', editingPersona.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Persona updated successfully",
      });
      setIsEditing(false);
      setEditingPersona(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (personaId: string) => {
    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Persona deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createdPersonas = personas.filter(p => p.status === 'ready');
  const deployedPersonas = personas.filter(p => p.status === 'deployed');

  return (
    <div className="space-y-8">
      {/* Created Personas Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-semibold text-white">Created Personas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {createdPersonas.map((persona) => (
            <Card key={persona.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">{persona.name}</CardTitle>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                    Ready
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  {persona.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mt-4">
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
                        <Button onClick={handleEdit} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                    onClick={() => handleDelete(persona.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deployed Personas Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <PlayCircle className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-white">Deployed Personas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deployedPersonas.map((persona) => (
            <Card key={persona.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">{persona.name}</CardTitle>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                    Deployed
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  {persona.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};