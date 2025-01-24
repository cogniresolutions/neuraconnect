import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PersonaAppearanceProps {
  personaId: string;
  onImageGenerated: (imageUrl: string) => void;
}

export const PersonaAppearance: React.FC<PersonaAppearanceProps> = ({
  personaId,
  onImageGenerated
}) => {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateImage = async () => {
    if (!description) {
      toast({
        title: "Description Required",
        description: "Please provide a description for the persona appearance.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-persona-image', {
        body: { description, style: 'natural' }
      });

      if (error) throw error;

      const imageUrl = data.imageUrl;
      setGeneratedImage(imageUrl);
      onImageGenerated(imageUrl);

      // Save to persona_appearances table
      const { error: dbError } = await supabase
        .from('persona_appearances')
        .insert({
          persona_id: personaId,
          image_url: imageUrl
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Persona appearance generated successfully.",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate persona appearance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Appearance Description</Label>
        <Textarea
          id="description"
          placeholder="Describe how you want your persona to look..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <Button
        onClick={generateImage}
        disabled={isGenerating || !description}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Generate Appearance
          </>
        )}
      </Button>

      {generatedImage && (
        <div className="mt-4">
          <img
            src={generatedImage}
            alt="Generated persona"
            className="rounded-lg w-full max-w-md mx-auto"
          />
        </div>
      )}
    </Card>
  );
};