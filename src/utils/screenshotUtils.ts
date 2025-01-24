import { supabase } from '@/integrations/supabase/client';

export const captureAndStoreScreenshot = async (
  videoElement: HTMLVideoElement,
  sessionId: string
): Promise<string> => {
  // Create canvas and capture frame
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Failed to get canvas context');
  
  ctx.drawImage(videoElement, 0, 0);
  
  // Convert to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/jpeg', 0.95);
  });

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Generate unique filename in user's folder
  const fileName = `${user.id}/${sessionId}/${Date.now()}.jpg`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('user_screenshots')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // Store metadata in database
  const { error: dbError } = await supabase
    .from('user_screenshots')
    .insert({
      user_id: user.id,
      file_path: fileName,
      session_id: sessionId,
    });

  if (dbError) throw dbError;

  return fileName;
};