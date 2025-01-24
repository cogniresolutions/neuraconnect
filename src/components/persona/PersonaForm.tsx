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
  const handleProfilePictureUpload = async (url: string) => {
    if (!personaId) return;
    
    try {
      await supabase
        .from('personas')
        .update({ profile_picture_url: url })
        .eq('id', personaId);
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    
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
            <SelectItem value="en-US">English (US)</SelectItem>
            <SelectItem value="en-GB">English (UK)</SelectItem>
            <SelectItem value="es-ES">Spanish</SelectItem>
            <SelectItem value="fr-FR">French</SelectItem>
            <SelectItem value="de-DE">German</SelectItem>
            <SelectItem value="it-IT">Italian</SelectItem>
            <SelectItem value="ja-JP">Japanese</SelectItem>
            <SelectItem value="ko-KR">Korean</SelectItem>
            <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice">Voice Style</Label>
        <div className="flex items-center gap-2">
          <Select value={voiceStyle} onValueChange={setVoiceStyle}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a voice style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Jenny">Jenny (Female)</SelectItem>
              <SelectItem value="Guy">Guy (Male)</SelectItem>
              <SelectItem value="Aria">Aria (Female)</SelectItem>
              <SelectItem value="Davis">Davis (Male)</SelectItem>
              <SelectItem value="Jane">Jane (Female)</SelectItem>
              <SelectItem value="Jason">Jason (Male)</SelectItem>
              <SelectItem value="Nancy">Nancy (Female)</SelectItem>
              <SelectItem value="Tony">Tony (Male)</SelectItem>
              <SelectItem value="Sara">Sara (Female)</SelectItem>
              <SelectItem value="Brandon">Brandon (Male)</SelectItem>
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
              onUploadComplete={handleProfilePictureUpload}
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