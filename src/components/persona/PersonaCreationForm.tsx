import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "./FileUpload";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload } from "lucide-react";

interface PersonaCreationFormProps {
  onSuccess?: () => void;
}

export const PersonaCreationForm: React.FC<PersonaCreationFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    voiceStyle: 'alloy',
    trainingVideo: null as File | null,
    profilePicture: null as File | null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, type: 'video' | 'profile') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const bucket = type === 'video' ? 'training_videos' : 'persona_profiles';
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;

      setUploadProgress(0);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          },
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let profileUrl = null;
      let videoUrl = null;

      if (formData.profilePicture) {
        profileUrl = await handleFileUpload(formData.profilePicture, 'profile');
      }

      if (formData.trainingVideo) {
        videoUrl = await handleFileUpload(formData.trainingVideo, 'video');
      }

      // Create the persona
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          voice_style: formData.voiceStyle,
          profile_picture_url: profileUrl,
          requires_training_video: true,
          status: 'pending',
        })
        .select()
        .single();

      if (personaError) throw personaError;

      // If we have a training video, create the training video record
      if (videoUrl && persona) {
        const { error: videoError } = await supabase
          .from('training_videos')
          .insert({
            user_id: user.id,
            persona_id: persona.id,
            video_url: videoUrl,
            consent_url: videoUrl, // In a real app, you'd want a separate consent form
            status: 'pending',
          });

        if (videoError) throw videoError;
      }

      toast({
        title: "Success",
        description: "Digital twin created successfully!",
      });

      onSuccess?.();
      navigate('/');
    } catch (error: any) {
      console.error('Error creating persona:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create digital twin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter your digital twin's name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your digital twin's personality and purpose"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="voiceStyle">Voice Style</Label>
        <Select
          value={formData.voiceStyle}
          onValueChange={(value) => handleInputChange('voiceStyle', value)}
        >
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
          <Label>Profile Picture</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData(prev => ({ ...prev, profilePicture: file }));
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Training Video</Label>
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData(prev => ({ ...prev, trainingVideo: file }));
              }
            }}
          />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress value={uploadProgress} className="w-full" />
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !formData.name || !formData.description}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Digital Twin...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Create Digital Twin
          </>
        )}
      </Button>
    </form>
  );
};