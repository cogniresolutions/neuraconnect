import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle, Edit2, ServerIcon } from "lucide-react";

type Persona = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updated_at: string;
};

export const PersonaList = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
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

    // Subscribe to realtime changes
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
    if (persona.status === 'deployed') {
      toast({
        title: "Already Deployed",
        description: "This persona is already deployed. Make changes to deploy again.",
        variant: "default",
      });
      return;
    }

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
      console.error('Deploy error:', error);
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleEdit = async (persona: Persona) => {
    // Navigate to edit page or open edit modal
    toast({
      title: "Edit Persona",
      description: "Edit functionality coming soon",
    });
  };

  const createdPersonas = personas.filter(p => p.status === 'ready');
  const deployedPersonas = personas.filter(p => p.status === 'deployed');

  return (
    <div className="space-y-8">
      {/* Created Personas Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Created Personas</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {createdPersonas.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </TableCell>
                  <TableCell className="font-medium">{persona.name}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-md truncate">
                    {persona.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(persona)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeploy(persona)}
                        disabled={isDeploying}
                        size="sm"
                      >
                        {isDeploying ? (
                          <ServerIcon className="h-4 w-4 animate-pulse" />
                        ) : (
                          <ServerIcon className="h-4 w-4" />
                        )}
                        Deploy
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Deployed Personas Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Deployed Personas</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployedPersonas.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>
                    <PlayCircle className="h-5 w-5 text-blue-500" />
                  </TableCell>
                  <TableCell className="font-medium">{persona.name}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-md truncate">
                    {persona.description}
                  </TableCell>
                  <TableCell>
                    {new Date(persona.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};