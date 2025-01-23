import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VideoUploader = () => {
  const { toast } = useToast();
  const [trainingVideo, setTrainingVideo] = useState<File | null>(null);
  const [consentVideo, setConsentVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'training' | 'consent') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'training') {
        setTrainingVideo(file);
      } else {
        setConsentVideo(file);
      }
    }
  };

  const uploadVideo = async (file: File, type: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const filePath = `${userId}/${type}/${crypto.randomUUID()}.mp4`;
    const { data, error } = await supabase.storage
      .from('training_videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trainingVideo || !consentVideo) {
      toast({
        title: "Missing Files",
        description: "Please upload both training and consent videos.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload both videos
      const trainingPath = await uploadVideo(trainingVideo, 'training');
      setUploadProgress(50);
      const consentPath = await uploadVideo(consentVideo, 'consent');
      setUploadProgress(75);

      // Create training video record
      const { error: dbError } = await supabase
        .from('training_videos')
        .insert({
          video_url: trainingPath,
          consent_url: consentPath,
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast({
        title: "Upload Successful",
        description: "Your videos have been uploaded successfully.",
      });
    } catch (error: any) {
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
          <label className="block text-sm font-medium mb-2">Training Video</label>
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'training')}
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
            Consent Video
            <span className="block text-xs text-gray-500 mt-1">
              Please record a short video confirming you have rights to use this content
            </span>
          </label>
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'consent')}
            disabled={isUploading}
          />
          {consentVideo && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {consentVideo.name}
            </div>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center">{uploadProgress}% uploaded</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isUploading || !trainingVideo || !consentVideo}
        className="w-full"
      >
        {isUploading ? (
          "Uploading..."
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Videos
          </>
        )}
      </Button>
    </form>
  );
};

export default VideoUploader;