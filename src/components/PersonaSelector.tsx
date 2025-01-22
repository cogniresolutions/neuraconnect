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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

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
        <div className="flex items-center gap-2">
          {selectedPersona && personas?.find(p => p.id === selectedPersona) ? (
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={personas.find(p => p.id === selectedPersona)?.avatar_url} 
                alt="Selected persona"
              />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          ) : null}
          <SelectValue placeholder="Select a persona" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          <div className="flex items-center gap-2">
            <span>None</span>
          </div>
        </SelectItem>
        {personas?.map((persona) => (
          <SelectItem key={persona.id} value={persona.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={persona.avatar_url} alt={persona.name} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span>{persona.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PersonaSelector;