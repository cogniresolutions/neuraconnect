import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  isUploading?: boolean;
  label?: string;
}

const FileUpload = ({ 
  onUpload, 
  accept, 
  maxSize = 5242880, // 5MB default
  isUploading = false,
  label = 'Upload file'
}: FileUploadProps) => {
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      try {
        await onUpload(acceptedFiles[0]);
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload file',
          variant: 'destructive',
        });
      }
    }
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
    >
      <input {...getInputProps()} />
      <Button variant="outline" disabled={isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {isDragActive ? 'Drop the file here' : label}
          </>
        )}
      </Button>
      <p className="mt-2 text-sm text-gray-500">
        {isDragActive ? 'Drop it here!' : 'or drag and drop'}
      </p>
    </div>
  );
};

export default FileUpload;