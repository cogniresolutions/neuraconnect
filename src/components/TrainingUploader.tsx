import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Upload, FileType, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrainingUploaderProps {
  personaId: string;
  onUploadComplete?: () => void;
}

const TrainingUploader: React.FC<TrainingUploaderProps> = ({ personaId, onUploadComplete }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${personaId}/${crypto.randomUUID()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('training_materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(percent);
          },
        });

      if (error) throw error;

      // Create record in persona_training_materials
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

      toast({
        title: "Upload Complete",
        description: "Training material has been uploaded successfully",
      });

      onUploadComplete?.();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Training Materials</h3>
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <FileType className="w-4 h-4 mr-2 animate-pulse" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload Material
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-gray-500">
            {Math.round(uploadProgress)}% uploaded
          </p>
        </div>
      )}

      {uploadProgress === 100 && !isUploading && (
        <div className="flex items-center justify-center text-green-500">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span>Upload Complete</span>
        </div>
      )}
    </Card>
  );
};

export default TrainingUploader;