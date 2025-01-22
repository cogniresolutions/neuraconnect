import { useEffect, useState } from "react";
import { PersonaCard } from "./PersonaCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PersonaList = () => {
  const [personas, setPersonas] = useState<any[]>([]);
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Personas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            id={persona.id}
            name={persona.name}
            description={persona.description}
            status={persona.status}
          />
        ))}
      </div>
    </div>
  );
};