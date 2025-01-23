import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PersonaForm } from "./PersonaForm";

interface PersonaCreationFormProps {
  onSuccess?: () => void;
}

export const PersonaCreationForm: React.FC<PersonaCreationFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    voiceStyle: 'alloy',
    language: 'en',
    trainingVideo: null as File | null,
    profilePicture: null as File | null,
  });

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the persona with language preference
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          voice_style: formData.voiceStyle,
          status: 'pending',
          model_config: {
            model: "gpt-4o-mini",
            max_tokens: 800,
            temperature: 0.7,
            language: formData.language
          }
        })
        .select()
        .single();

      if (personaError) throw personaError;

      toast({
        title: "Success",
        description: "Digital persona created successfully!",
      });

      onSuccess?.();
      navigate('/');
    } catch (error: any) {
      console.error('Error creating persona:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create digital persona",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PersonaForm
      name={formData.name}
      setName={(name) => setFormData(prev => ({ ...prev, name }))}
      description={formData.description}
      setDescription={(description) => setFormData(prev => ({ ...prev, description }))}
      voiceStyle={formData.voiceStyle}
      setVoiceStyle={(voiceStyle) => setFormData(prev => ({ ...prev, voiceStyle }))}
      language={formData.language}
      setLanguage={(language) => setFormData(prev => ({ ...prev, language }))}
      onSubmit={handleSubmit}
      isCreating={isLoading}
    />
  );
};