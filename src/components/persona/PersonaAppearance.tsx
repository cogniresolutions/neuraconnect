import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PersonaAppearanceProps {
  personaId: string;
  onImageGenerated: (url: string) => void;
}

export const PersonaAppearance = ({ personaId, onImageGenerated }: PersonaAppearanceProps) => {
  const [imageDescription, setImageDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!imageDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-persona-image', {
        body: { description: imageDescription }
      });

      if (error) throw error;

      const imageUrl = data.url;
      setGeneratedImage(imageUrl);
      onImageGenerated(imageUrl);

      // Update the personas table with the new avatar URL
      const { error: dbError } = await supabase
        .from('personas')
        .update({
          avatar_url: imageUrl,
        })
        .eq('id', personaId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image generated and saved successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Describe how you want your persona to look..."
          value={imageDescription}
          onChange={(e) => setImageDescription(e.target.value)}
          disabled={isGenerating}
          className="flex-1"
        />
        <Button 
          onClick={generateImage}
          disabled={isGenerating || !imageDescription.trim()}
        >
          {isGenerating ? "Generating..." : "Generate Image"}
        </Button>
      </div>

      {generatedImage && (
        <div className="mt-4">
          <img
            src={generatedImage}
            alt="Generated persona"
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>
      )}
    </div>
  );
};