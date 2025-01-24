import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrainingMaterialUploaderProps {
  personaId: string;
  onUploadComplete?: () => void;
}

const TrainingMaterialUploader: React.FC<TrainingMaterialUploaderProps> = ({
  personaId,
  onUploadComplete
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${personaId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('training_materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

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

      // Process with Azure OpenAI
      const { error: processError } = await supabase.functions.invoke('process-training-material', {
        body: { 
          personaId,
          filePath,
          fileType: file.type
        }
      });

      if (processError) throw processError;

      toast({
        title: "Upload Successful",
        description: "Training material has been uploaded and is being processed",
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
      setUploadProgress(100);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Training Materials</h3>
        <Button
          variant="outline"
          onClick={() => document.getElementById('training-material-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4 mr-2" />
              Upload Material
            </>
          )}
        </Button>
        <input
          id="training-material-upload"
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.wordpress,video/*"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-gray-500">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}
    </Card>
  );
};

export default TrainingMaterialUploader;