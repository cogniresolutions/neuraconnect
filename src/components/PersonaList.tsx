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
import { CheckCircle, UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Persona {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

const PersonaList = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deployingPersona, setDeployingPersona] = useState<Persona | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
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
          return;
        }

        setPersonas(data || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
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
        (payload) => {
          fetchPersonas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const validatePersonaForDeployment = (description: string) => {
    if (!description || description.trim().length < 10) {
      return "Description must be at least 10 characters long";
    }
    
    const lowercaseDesc = description.toLowerCase();
    const forbiddenTerms = ['harmful', 'illegal', 'malicious', 'offensive'];
    const foundTerm = forbiddenTerms.find(term => lowercaseDesc.includes(term));
    
    if (foundTerm) {
      return `Description contains inappropriate content: "${foundTerm}"`;
    }

    return null;
  };

  const handleDeploy = async () => {
    if (!deployingPersona) return;

    // Only allow deployment of created personas
    if (deployingPersona.status !== 'ready') {
      toast({
        title: "Error",
        description: "Only created personas can be deployed",
        variant: "destructive",
      });
      return;
    }

    // Validate persona before deployment
    const validationError = validatePersonaForDeployment(deployingPersona.description);
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    try {
      const { error } = await supabase.functions.invoke("deploy-persona", {
        body: { personaId: deployingPersona.id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deployment initiated successfully",
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deploy persona",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
      setDeployingPersona(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const createdPersonas = personas.filter(p => p.status === 'ready');
  const deployedPersonas = personas.filter(p => p.status === 'deployed');

  return (
    <div className="space-y-8">
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDeployingPersona(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Persona</DialogTitle>
          </DialogHeader>
          {deployingPersona && (
            <>
              <div className="py-4">
                <h3 className="font-medium mb-2">Validation Status</h3>
                {validatePersonaForDeployment(deployingPersona.description) ? (
                  <div className="text-red-500">
                    {validatePersonaForDeployment(deployingPersona.description)}
                  </div>
                ) : (
                  <div className="text-green-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ready to deploy
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying || !!validatePersonaForDeployment(deployingPersona.description)}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    'Deploy'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="text-xl font-semibold mb-4">Created Personas</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {createdPersonas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No created personas yet
                </TableCell>
              </TableRow>
            ) : (
              createdPersonas.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>{persona.name}</TableCell>
                  <TableCell>{persona.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <UserPlus className="h-4 w-4 mr-2 text-green-500" />
                      Created
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(persona.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-500 hover:text-blue-600"
                      onClick={() => {
                        setDeployingPersona(persona);
                        setIsDialogOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Deployed Personas</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deployedPersonas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No deployed personas yet
                </TableCell>
              </TableRow>
            ) : (
              deployedPersonas.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>{persona.name}</TableCell>
                  <TableCell>{persona.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                      Deployed
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(persona.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PersonaList;