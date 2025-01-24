import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "./FileUpload";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { VoiceTest } from "./VoiceTest";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface VoiceMapping {
  id: string;
  language_code: string;
  voice_style: string;
  gender: string;
  azure_voice_name: string;
  display_name: string;
}

interface PersonaFormProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  voiceStyle: string;
  setVoiceStyle: (style: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
  personaId?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'zh-CN': 'Chinese (Simplified)'
};

export function PersonaForm({
  name,
  setName,
  description,
  setDescription,
  voiceStyle,
  setVoiceStyle,
  language,
  setLanguage,
  onSubmit,
  isCreating,
  personaId
}: PersonaFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: voiceMappings, isLoading: isLoadingVoices } = useQuery({
    queryKey: ['voiceMappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_mappings')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      return data as VoiceMapping[];
    },
  });

  // Filter voices based on selected language
  const filteredVoices = voiceMappings?.filter(
    voice => voice.language_code === language
  ) || [];

  const syncVoiceMappings = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('sync-voice-mappings');
      if (error) throw error;

      // Invalidate the voice mappings query to trigger a refresh
      await queryClient.invalidateQueries({ queryKey: ['voiceMappings'] });

      toast({
        title: "Success",
        description: "Voice mappings synchronized successfully",
      });
    } catch (error: any) {
      console.error('Error syncing voice mappings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync voice mappings",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    // Reset voice style when language changes
    if (filteredVoices.length > 0) {
      setVoiceStyle(filteredVoices[0].voice_style);
    }
    
    // Sync voice mappings when language changes
    await syncVoiceMappings();
    
    if (personaId) {
      try {
        await supabase
          .from('personas')
          .update({
            model_config: {
              model: "gpt-4o-mini",
              max_tokens: 800,
              temperature: 0.7,
              language: newLanguage
            }
          })
          .eq('id', personaId);
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  return (
    <div className="space-y-6 bg-white/5 p-6 rounded-lg border border-purple-400/20">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter persona name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your persona"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice">Voice Style</Label>
        <div className="flex items-center gap-2">
          <Select 
            value={voiceStyle} 
            onValueChange={setVoiceStyle}
            disabled={isLoadingVoices || isSyncing || filteredVoices.length === 0}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={
                isSyncing ? "Syncing voices..." :
                isLoadingVoices ? "Loading voices..." :
                "Select a voice style"
              } />
            </SelectTrigger>
            <SelectContent>
              {filteredVoices.map((voice) => (
                <SelectItem key={voice.id} value={voice.voice_style}>
                  {voice.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <VoiceTest voiceStyle={voiceStyle} language={language} />
        </div>
      </div>

      {personaId && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <FileUpload
              personaId={personaId}
              type="profile"
              onUploadComplete={() => {}}
              accept="image/*"
            />
          </div>

          <div className="space-y-2">
            <Label>Training Materials</Label>
            <FileUpload
              personaId={personaId}
              type="training"
              onUploadComplete={() => {}}
              accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf,.txt"
            />
          </div>
        </div>
      )}

      <Button
        onClick={onSubmit}
        disabled={isCreating || !name || !description}
        className="w-full"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Persona...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Create Persona
          </>
        )}
      </Button>
    </div>
  );
}