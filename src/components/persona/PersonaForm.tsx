import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Video } from "lucide-react";
import { Link } from "react-router-dom";

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

export function PersonaForm({
  name,
  setName,
  description,
  setDescription,
  voiceStyle,
  setVoiceStyle,
  onSubmit,
  isCreating,
}: PersonaFormProps) {
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
        <Label htmlFor="voice">Voice Style</Label>
        <Select value={voiceStyle} onValueChange={setVoiceStyle}>
          <SelectTrigger>
            <SelectValue placeholder="Select a voice style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
            <SelectItem value="echo">Echo (Male)</SelectItem>
            <SelectItem value="fable">Fable (Male)</SelectItem>
            <SelectItem value="onyx">Onyx (Male)</SelectItem>
            <SelectItem value="nova">Nova (Female)</SelectItem>
            <SelectItem value="shimmer">Shimmer (Female)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Link 
          to="/deploy" 
          className="flex items-center justify-center w-full p-4 text-sm text-purple-200 bg-purple-900/30 rounded-lg border border-purple-400/20 hover:bg-purple-900/40 transition-colors"
        >
          <Video className="w-4 h-4 mr-2" />
          Upload Training Video
        </Link>

        <Button
          onClick={onSubmit}
          disabled={isCreating || !name || !description}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Persona...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Create Persona
            </>
          )}
        </Button>
      </div>
    </div>
  );
}