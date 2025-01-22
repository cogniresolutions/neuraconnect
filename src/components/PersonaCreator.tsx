import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonaFormData {
  name: string;
  description: string;
  voiceStyle: string;
  personality: string;
}

export default function PersonaCreator() {
  const [formData, setFormData] = useState<PersonaFormData>({
    name: '',
    description: '',
    voiceStyle: '',
    personality: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-personas', {
        body: {
          method: 'POST',
          action: 'create',
          data: formData
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Persona created successfully!",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        voiceStyle: '',
        personality: ''
      });
    } catch (error) {
      console.error('Error creating persona:', error);
      toast({
        title: "Error",
        description: "Failed to create persona. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Create New Persona</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter persona name"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your persona"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="voiceStyle" className="text-sm font-medium">Voice Style</label>
          <Input
            id="voiceStyle"
            name="voiceStyle"
            value={formData.voiceStyle}
            onChange={handleInputChange}
            placeholder="e.g., friendly, professional, energetic"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="personality" className="text-sm font-medium">Personality</label>
          <Textarea
            id="personality"
            name="personality"
            value={formData.personality}
            onChange={handleInputChange}
            placeholder="Describe the personality traits"
            required
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Persona'}
        </Button>
      </form>
    </div>
  );
}