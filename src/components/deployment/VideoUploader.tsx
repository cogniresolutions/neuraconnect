import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle2, AlertCircle, FileType } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VideoUploader = () => {
  const { toast } = useToast();
  const [trainingVideo, setTrainingVideo] = useState<File | null>(null);
  const [trainingMaterials, setTrainingMaterials] = useState<File[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'materials' | 'profile') => {
    const files = event.target.files;
    if (!files) return;

    if (type === 'video') {
      setTrainingVideo(files[0]);
    } else if (type === 'materials') {
      setTrainingMaterials(Array.from(files));
    } else {
      setProfilePicture(files[0]);
    }
  };

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${folder}/${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload profile picture if provided
      let profileUrl = null;
      if (profilePicture) {
        const path = await uploadFile(profilePicture, 'persona_profiles', 'avatars');
        profileUrl = supabase.storage.from('persona_profiles').getPublicUrl(path).data.publicUrl;
        setUploadProgress(20);
      }

      // Upload training video
      let videoUrl = null;
      if (trainingVideo) {
        const path = await uploadFile(trainingVideo, 'training_videos', 'videos');
        videoUrl = supabase.storage.from('training_videos').getPublicUrl(path).data.publicUrl;
        setUploadProgress(50);
      }

      // Upload training materials
      const materialPaths = [];
      for (const file of trainingMaterials) {
        const path = await uploadFile(file, 'training_materials', 'documents');
        materialPaths.push({
          name: file.name,
          path: path,
          type: file.type,
          size: file.size
        });
        setUploadProgress(prev => prev + (30 / trainingMaterials.length));
      }

      // Create database records
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: dbError } = await supabase.from('personas').update({
        profile_picture_url: profileUrl,
        training_materials: materialPaths,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast({
        title: "Upload Successful",
        description: "All materials have been uploaded successfully.",
      });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Profile Picture</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'profile')}
            disabled={isUploading}
          />
          {profilePicture && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {profilePicture.name}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Training Video</label>
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'video')}
            disabled={isUploading}
          />
          {trainingVideo && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {trainingVideo.name}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Training Materials
            <span className="block text-xs text-gray-500 mt-1">
              Upload Word, PPT, Excel, PDF files for training
            </span>
          </label>
          <Input
            type="file"
            accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf,.txt"
            multiple
            onChange={(e) => handleFileChange(e, 'materials')}
            disabled={isUploading}
          />
          {trainingMaterials.length > 0 && (
            <div className="mt-2 space-y-2">
              {trainingMaterials.map((file, index) => (
                <div key={index} className="flex items-center text-sm text-green-600">
                  <FileType className="w-4 h-4 mr-2" />
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center">{Math.round(uploadProgress)}% uploaded</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isUploading || (!profilePicture && !trainingVideo && !trainingMaterials.length)}
        className="w-full"
      >
        {isUploading ? (
          "Uploading..."
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Materials
          </>
        )}
      </Button>
    </form>
  );
};

export default VideoUploader;