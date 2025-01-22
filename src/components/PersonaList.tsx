import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Persona {
  id: string;
  name: string;
  description: string;
  voiceStyle: string;
  personality: string;
}

export default function PersonaList() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPersonas = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-personas', {
        body: {
          method: 'GET',
          action: 'list'
        }
      });

      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Error fetching personas:', error);
      toast({
        title: "Error",
        description: "Failed to fetch personas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-personas', {
        body: {
          method: 'DELETE',
          action: 'delete',
          data: { id }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Persona deleted successfully!",
      });

      // Refresh the list
      fetchPersonas();
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast({
        title: "Error",
        description: "Failed to delete persona. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  if (isLoading) {
    return <div className="text-center p-6">Loading personas...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Your Personas</h2>
      
      <div className="space-y-4">
        {personas.length === 0 ? (
          <p className="text-center text-gray-500">No personas created yet.</p>
        ) : (
          personas.map((persona) => (
            <div
              key={persona.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{persona.name}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(persona.id)}
                >
                  Delete
                </Button>
              </div>
              <p className="text-sm text-gray-600">{persona.description}</p>
              <div className="text-sm">
                <p><strong>Voice Style:</strong> {persona.voiceStyle}</p>
                <p><strong>Personality:</strong> {persona.personality}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}