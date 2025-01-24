import { supabase } from "@/integrations/supabase/client";

export const analyzeVideoFrame = async (
  imageData: string,
  personaId: string,
  userId: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-video', {
      body: { 
        imageData,
        personaId,
        userId
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error analyzing video frame:', error);
    throw error;
  }
};