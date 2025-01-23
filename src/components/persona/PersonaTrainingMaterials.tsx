import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from '../upload/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { File, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrainingMaterial {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
}

interface PersonaTrainingMaterialsProps {
  personaId: string;
  materials?: TrainingMaterial[];
  onMaterialsChange?: (materials: TrainingMaterial[]) => void;
}

const PersonaTrainingMaterials = ({
  personaId,
  materials = [],
  onMaterialsChange
}: PersonaTrainingMaterialsProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const filePath = `${personaId}/materials/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('training_materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('persona_training_materials')
        .insert({
          persona_id: personaId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (onMaterialsChange && data) {
        onMaterialsChange([...materials, data as TrainingMaterial]);
      }

      toast({
        title: 'Success',
        description: 'Training material uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading training material:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload training material',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      const material = materials.find(m => m.id === materialId);
      if (!material) return;

      const { error: deleteError } = await supabase
        .from('persona_training_materials')
        .delete()
        .eq('id', materialId);

      if (deleteError) throw deleteError;

      if (onMaterialsChange) {
        onMaterialsChange(materials.filter(m => m.id !== materialId));
      }

      toast({
        title: 'Success',
        description: 'Training material deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting training material:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete training material',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload
        onUpload={handleUpload}
        accept={{
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.ms-powerpoint': ['.ppt'],
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
          'text/plain': ['.txt']
        }}
        maxSize={10485760} // 10MB
        isUploading={isUploading}
        label="Upload training material"
      />

      <div className="space-y-2">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <File className="h-4 w-4" />
              <span className="text-sm">{material.file_name}</span>
              {material.status === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(material.id)}
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonaTrainingMaterials;