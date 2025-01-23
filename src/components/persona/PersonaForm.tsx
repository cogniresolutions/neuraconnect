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
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [validationResult, setValidationResult] = useState({
    isValid: true,
    issues: [] as string[],
    suggestions: [] as string[],
  });
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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

  const stopCurrentAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  };

  const handleTestVoice = async () => {
    try {
      stopCurrentAudio();
      setIsTestingVoice(true);
      console.log('Starting Azure voice test...');
      
      // First test Azure connectivity
      const { data: azureTest, error: azureError } = await supabase.functions.invoke('azure-voice-test');
      
      if (azureError) {
        console.error('Azure test error:', azureError);
        throw new Error('Failed to connect to Azure services');
      }

      console.log('Azure test response:', azureTest);

      if (!azureTest.success) {
        throw new Error(azureTest.error || 'Azure voice services not available');
      }

      setIsSpeaking(true);
      const testText = `Hello, I'm ${name}. ${description.split('.')[0]}.`;
      console.log('Synthesizing speech with text:', testText);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: testText,
          voice: voiceStyle
        }
      });

      if (error) {
        console.error('Speech synthesis error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        console.error('No audio content received');
        throw new Error('No audio content received');
      }

      console.log('Creating audio element...');
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      setAudioElement(audio);
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        throw new Error('Failed to play audio');
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setIsTestingVoice(false);
      };

      await audio.play();
      console.log('Audio playing...');
      
      toast({
        title: "Voice Test",
        description: "Playing voice sample...",
      });

    } catch (error: any) {
      console.error('Voice test error:', error);
      setIsSpeaking(false);
      setIsTestingVoice(false);
      toast({
        title: "Voice Test Failed",
        description: error.message || "Failed to test voice",
        variant: "destructive",
      });
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
          disabled={isTestingVoice || isSpeaking || !name || !description || !voiceStyle}
          className="w-full text-purple-400 border-purple-400/30"
        >
          {isTestingVoice ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Voice...
            </>
          ) : isSpeaking ? (
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