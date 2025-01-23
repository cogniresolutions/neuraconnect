import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileType, Image as ImageIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  personaId: string;
  type: 'profile' | 'training';
  onUploadComplete: (url: string) => void;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  personaId,
  type,
  onUploadComplete,
  accept = "image/*"
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const bucket = type === 'profile' ? 'persona_profiles' : 'training_materials';
      const fileExt = file.name.split('.').pop();
      const filePath = `${personaId}/${crypto.randomUUID()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL for profile pictures
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (type === 'training') {
        // Record training material metadata
        const { error: dbError } = await supabase
          .from('persona_training_materials')
          .insert({
            persona_id: personaId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_path: filePath,
          });

        if (dbError) throw dbError;
      }

      onUploadComplete(publicUrl);
      
      toast({
        title: "Upload successful",
        description: `${type === 'profile' ? 'Profile picture' : 'Training material'} uploaded successfully`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
      />
      
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        variant="outline"
        className="w-full"
      >
        {isUploading ? (
          <>
            <FileType className="mr-2 h-4 w-4 animate-pulse" />
            Uploading...
          </>
        ) : type === 'profile' ? (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Upload Profile Picture
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Training Material
          </>
        )}
      </Button>

      {isUploading && (
        <Progress value={progress} className="w-full" />
      )}
    </div>
  );
};