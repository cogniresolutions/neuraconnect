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
import { Loader2, Upload, Video, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrainingVideo {
  id: string;
  video_url: string;
  created_at: string;
}

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
  const { toast } = useToast();
  const [existingVideos, setExistingVideos] = useState<TrainingVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isDeletingVideo, setIsDeletingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchUserVideos();
  }, []);

  const fetchUserVideos = async () => {
    try {
      const { data: videos, error } = await supabase
        .from('training_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingVideos(videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load training videos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      setIsDeletingVideo(videoId);
      const { error } = await supabase
        .from('training_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setExistingVideos(prevVideos => 
        prevVideos.filter(video => video.id !== videoId)
      );

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    } finally {
      setIsDeletingVideo(null);
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
        <div className="space-y-2">
          <Label>Training Videos</Label>
          {isLoadingVideos ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : existingVideos.length > 0 ? (
            <div className="space-y-2">
              {existingVideos.map((video) => (
                <div 
                  key={video.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-200">
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                    disabled={isDeletingVideo === video.id}
                  >
                    {isDeletingVideo === video.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No training videos uploaded yet</p>
          )}
        </div>

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