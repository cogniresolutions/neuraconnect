import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  avatar_url: string;
}

interface PersonaSelectorProps {
  onPersonaSelect: (persona: Persona | null) => void;
  selectedPersonaId?: string;
}

const PersonaSelector = ({ onPersonaSelect, selectedPersonaId }: PersonaSelectorProps) => {
  const { data: personas, isLoading } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .in('status', ['ready', 'deployed']);
      
      if (error) throw error;
      return data as Persona[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading personas...</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedPersonaId}
      onValueChange={(value) => {
        const selectedPersona = personas?.find(p => p.id === value) || null;
        onPersonaSelect(selectedPersona);
      }}
    >
      <SelectTrigger className="w-[200px] bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <SelectValue placeholder="Select a persona" />
      </SelectTrigger>
      <SelectContent>
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