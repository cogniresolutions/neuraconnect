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
import { Badge } from "@/components/ui/badge";
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
    toast({
      title: "Edit Persona",
      description: "Edit functionality coming soon",
    });
  };

  const createdPersonas = personas.filter(p => p.status === 'ready');
  const deployedPersonas = personas.filter(p => p.status === 'deployed');

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'deployed') {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
          <PlayCircle className="h-3 w-3" />
          Deployed
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Ready
      </Badge>
    );
  };

  return (
    <div className="space-y-8 p-6 bg-black rounded-lg">
      {/* Created Personas Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Created Personas
        </h2>
        <div className="rounded-md border border-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-900">
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">Description</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {createdPersonas.map((persona) => (
                <TableRow key={persona.id} className="border-gray-800 hover:bg-gray-900">
                  <TableCell>
                    <StatusBadge status={persona.status} />
                  </TableCell>
                  <TableCell className="font-medium text-white">{persona.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-400 max-w-md truncate">
                    {persona.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(persona)}
                        className="bg-gray-800 hover:bg-gray-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeploy(persona)}
                        disabled={isDeploying}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
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
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-500" />
          Deployed Personas
        </h2>
        <div className="rounded-md border border-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-900">
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">Description</TableHead>
                <TableHead className="text-gray-400">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployedPersonas.map((persona) => (
                <TableRow key={persona.id} className="border-gray-800 hover:bg-gray-900">
                  <TableCell>
                    <StatusBadge status={persona.status} />
                  </TableCell>
                  <TableCell className="font-medium text-white">{persona.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-400 max-w-md truncate">
                    {persona.description}
                  </TableCell>
                  <TableCell className="text-gray-400">
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