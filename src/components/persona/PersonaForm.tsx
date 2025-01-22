import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VALID_VOICES } from "@/constants/voices";
import { validatePersonaDescription, getSuggestedDescription } from "@/utils/personaValidation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, Loader2 } from "lucide-react";

interface PersonaFormProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  voiceStyle: string;
  setVoiceStyle: (style: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
}

export const PersonaForm = ({
  name,
  setName,
  description,
  setDescription,
  voiceStyle,
  setVoiceStyle,
  onSubmit,
  isCreating
}: PersonaFormProps) => {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [validationResult, setValidationResult] = useState({
    isValid: true,
    issues: [] as string[],
    suggestions: [] as string[],
  });

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    const result = validatePersonaDescription(newDescription);
    setValidationResult(result);
  };

  const handleSuggestImprovement = () => {
    const improvedDescription = getSuggestedDescription(description);
    setDescription(improvedDescription);
    const result = validatePersonaDescription(improvedDescription);
    setValidationResult(result);
    toast({
      title: "Description Updated",
      description: "The description has been improved with suggested changes.",
    });
  };

  const handleTestVoice = async () => {
    try {
      setIsSpeaking(true);
      console.log('Starting voice test with:', { name, description, voiceStyle });
      
      const testText = `Hello, I'm ${name}. ${description.split('.')[0]}.`;
      console.log('Test text:', testText);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: testText,
          voice: voiceStyle
        }
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        console.error('No audio content in response');
        throw new Error('No audio content received');
      }

      console.log('Creating audio element with content length:', data.audioContent.length);
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        throw new Error('Failed to play audio');
      };

      await audio.play();
      console.log('Audio played successfully');
      
      toast({
        title: "Voice Test Successful",
        description: "The voice test completed successfully.",
      });

    } catch (error: any) {
      console.error('Voice test error:', error);
      toast({
        title: "Voice Test Failed",
        description: error.message || "Failed to test voice",
        variant: "destructive",
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Input
        placeholder="Persona Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400"
      />
      <div className="space-y-2">
        <Textarea
          placeholder="Describe your persona's personality and capabilities..."
          value={description}
          onChange={handleDescriptionChange}
          className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400 min-h-[120px]"
        />
        {!validationResult.isValid && (
          <div className="text-red-400 text-sm space-y-1">
            {validationResult.issues.map((issue, index) => (
              <p key={index}>{issue}</p>
            ))}
          </div>
        )}
        {validationResult.suggestions.length > 0 && (
          <Button
            variant="outline"
            onClick={handleSuggestImprovement}
            className="text-purple-400 border-purple-400/30"
          >
            Suggest Improvement
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <Select value={voiceStyle} onValueChange={setVoiceStyle}>
          <SelectTrigger className="bg-white/10 border-purple-400/30 text-white">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {VALID_VOICES.map((voice) => (
              <SelectItem key={voice} value={voice}>
                {voice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestVoice}
          disabled={isSpeaking || !name || !description || !voiceStyle}
          className="w-full text-purple-400 border-purple-400/30"
        >
          {isSpeaking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speaking...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Test Voice
            </>
          )}
        </Button>
      </div>
      <Button
        onClick={onSubmit}
        disabled={isCreating || !name || !description || !voiceStyle}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isCreating ? "Creating..." : "Create Persona"}
      </Button>
    </div>
  );
};