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
import { CheckCircle, UserPlus, Loader2, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [deployingPersona, setDeployingPersona] = useState<Persona | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
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

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setNewDescription(persona.description);
    setIsDialogOpen(true);
  };

  const handleDelete = async (personaId: string) => {
    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleDeployClick = (persona: Persona) => {
    setDeployingPersona(persona);
    setIsDeployDialogOpen(true);
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
      setIsDeployDialogOpen(false);
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

  const handleUpdate = async () => {
    if (!editingPersona) return;

    // Validate the new description before updating
    const validationError = validatePersonaForDeployment(newDescription);
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Update the description
      const { error: updateError } = await supabase
        .from('personas')
        .update({ description: newDescription })
        .eq('id', editingPersona.id);

      if (updateError) throw updateError;

      // If the persona was already deployed, trigger redeployment
      if (editingPersona.status === 'deployed') {
        const { error: deployError } = await supabase.functions.invoke("deploy-persona", {
          body: { personaId: editingPersona.id }
        });

        if (deployError) throw deployError;
      }

      toast({
        title: "Success",
        description: editingPersona.status === 'deployed' 
          ? "Persona updated and redeployment initiated"
          : "Persona updated successfully",
      });

      setIsDialogOpen(false);
      setEditingPersona(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPersona(null);
    setNewDescription("");
  };

  const handleDeployDialogClose = () => {
    setIsDeployDialogOpen(false);
    setDeployingPersona(null);
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

  const PersonaTableRow = ({ persona }: { persona: Persona }) => (
    <TableRow key={persona.id}>
      <TableCell>{persona.name}</TableCell>
      <TableCell>{persona.description}</TableCell>
      <TableCell>
        <div className="flex items-center">
          {persona.status === 'deployed' ? (
            <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2 text-green-500" />
          )}
          {persona.status === 'deployed' ? 'Deployed' : 'Created'}
        </div>
      </TableCell>
      <TableCell>
        {new Date(persona.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen && editingPersona?.id === persona.id} onOpenChange={(open) => !open && handleDialogClose()}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(persona)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Persona Description</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter new description"
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    persona.status === 'deployed' ? 'Update & Redeploy' : 'Update'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {persona.status === 'ready' && (
            <Dialog open={isDeployDialogOpen && deployingPersona?.id === persona.id} onOpenChange={(open) => !open && handleDeployDialogClose()}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blue-500 hover:text-blue-600"
                  onClick={() => handleDeployClick(persona)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deploy Persona</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <h3 className="font-medium mb-2">Validation Status</h3>
                  {validatePersonaForDeployment(persona.description) ? (
                    <div className="text-red-500">
                      {validatePersonaForDeployment(persona.description)}
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
                    disabled={isDeploying || !!validatePersonaForDeployment(persona.description)}
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
              </DialogContent>
            </Dialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Persona</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this persona? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(persona.id)}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-8">
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
                <PersonaTableRow key={persona.id} persona={persona} />
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deployedPersonas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No deployed personas yet
                </TableCell>
              </TableRow>
            ) : (
              deployedPersonas.map((persona) => (
                <PersonaTableRow key={persona.id} persona={persona} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PersonaList;