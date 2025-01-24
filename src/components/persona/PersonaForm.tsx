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
import { useQuery } from "@tanstack/react-query";
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

  // Query voice mappings with automatic background sync and retry
  const { data: voiceMappings, isLoading: isLoadingVoices } = useQuery({
    queryKey: ['voiceMappings'],
    queryFn: async () => {
      const { data: existingData, error: fetchError } = await supabase
        .from('voice_mappings')
        .select('*')
        .order('display_name');
      
      if (fetchError) throw fetchError;

      // If no data exists, trigger sync and fetch again
      if (!existingData || existingData.length === 0) {
        await supabase.functions.invoke('sync-voice-mappings');
        
        const { data: syncedData, error: syncError } = await supabase
          .from('voice_mappings')
          .select('*')
          .order('display_name');
          
        if (syncError) throw syncError;
        return syncedData as VoiceMapping[];
      }

      return existingData as VoiceMapping[];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 30000),
  });

  // Filter voices based on selected language
  const filteredVoices = voiceMappings?.filter(
    voice => voice.language_code === language
  ) || [];

  // Handle language change with automatic voice style update
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Set first available voice for the new language
    const availableVoices = voiceMappings?.filter(
      voice => voice.language_code === newLanguage
    ) || [];
    
    if (availableVoices.length > 0) {
      setVoiceStyle(availableVoices[0].voice_style);
    }
  };

  // Set initial voice style when voices are loaded
  useEffect(() => {
    if (filteredVoices.length > 0 && !voiceStyle) {
      setVoiceStyle(filteredVoices[0].voice_style);
    }
  }, [filteredVoices, voiceStyle, setVoiceStyle]);

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
            disabled={isLoadingVoices || filteredVoices.length === 0}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={
                isLoadingVoices ? "Loading voices..." :
                filteredVoices.length === 0 ? "No voices available for this language" :
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