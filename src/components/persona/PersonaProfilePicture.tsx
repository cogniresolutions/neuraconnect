import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from '../upload/FileUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface PersonaProfilePictureProps {
  personaId: string;
  existingUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

const PersonaProfilePicture = ({ 
  personaId, 
  existingUrl,
  onUploadComplete 
}: PersonaProfilePictureProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${personaId}/profile/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('persona_profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('persona_profiles')
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      
      toast({
        title: 'Success',
        description: 'Profile picture uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Avatar className="w-24 h-24 mx-auto">
        <AvatarImage src={existingUrl || undefined} alt="Profile" />
        <AvatarFallback>PP</AvatarFallback>
      </Avatar>
      
      <FileUpload
        onUpload={handleUpload}
        accept={{
          'image/*': ['.png', '.jpg', '.jpeg', '.gif']
        }}
        maxSize={5242880} // 5MB
        isUploading={isUploading}
        label="Upload profile picture"
      />
    </div>
  );
};

export default PersonaProfilePicture;