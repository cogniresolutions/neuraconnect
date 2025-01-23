import { supabase } from "@/integrations/supabase/client";

export const analyzeEmotionAndEnvironment = async (
  imageData: string,
  personaId: string,
  userId: string
) => {
  try {
    console.log('Starting emotion and environment analysis...');
    
    const [emotionResponse, environmentResponse] = await Promise.all([
      supabase.functions.invoke('analyze-emotion', {
        body: { 
          imageData,
          personaId,
          userId,
        }
      }),
      supabase.functions.invoke('analyze-environment', {
        body: { 
          imageData,
          personaId,
          userId
        }
      })
    ]);

    if (emotionResponse.error) throw emotionResponse.error;
    if (environmentResponse.error) throw environmentResponse.error;

    // Store analysis results in the database
    const { error: dbError } = await supabase
      .from('emotion_analysis')
      .insert({
        user_id: userId,
        persona_id: personaId,
        emotion_data: emotionResponse.data?.emotions,
        environment_data: environmentResponse.data?.environment,
        environment_context: environmentResponse.data?.context,
        background_objects: environmentResponse.data?.objects,
        scene_description: environmentResponse.data?.description
      });

    if (dbError) throw dbError;

    return {
      emotions: emotionResponse.data?.emotions,
      environment: environmentResponse.data?.environment
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};