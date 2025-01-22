import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PersonaSelectorProps {
  onPersonaSelect: (personaId: string | null) => void;
}

const PersonaSelector = ({ onPersonaSelect }: PersonaSelectorProps) => {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: personas } = useQuery({
    queryKey: ['deployed-personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('status', 'deployed');

      if (error) {
        toast({
          title: "Error fetching personas",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    },
  });

  const handlePersonaChange = (value: string) => {
    setSelectedPersona(value);
    onPersonaSelect(value);
  };

  return (
    <Select onValueChange={handlePersonaChange} value={selectedPersona || undefined}>
      <SelectTrigger className="w-full bg-white/10 backdrop-blur-sm text-white border-white/20">
        <SelectValue placeholder="Select a persona" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">None</SelectItem>
        {personas?.map((persona) => (
          <SelectItem key={persona.id} value={persona.id}>
            {persona.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PersonaSelector;