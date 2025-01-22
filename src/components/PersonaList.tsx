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
import { CheckCircle, XCircle, Loader2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [newDescription, setNewDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
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
  };

  const handleUpdate = async () => {
    if (!editingPersona) return;

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
          <CheckCircle className={`h-4 w-4 mr-2 ${persona.status === 'deployed' ? 'text-blue-500' : 'text-green-500'}`} />
          {persona.status === 'deployed' ? 'Deployed' : 'Created'}
        </div>
      </TableCell>
      <TableCell>
        {new Date(persona.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <Dialog>
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