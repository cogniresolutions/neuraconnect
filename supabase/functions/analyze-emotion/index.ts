import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const AZURE_COGNITIVE_ENDPOINT = Deno.env.get('AZURE_COGNITIVE_ENDPOINT');
const AZURE_API_KEY = Deno.env.get('AZURE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, userId, personaId } = await req.json();

    if (!AZURE_COGNITIVE_ENDPOINT || !AZURE_API_KEY) {
      throw new Error("Azure Cognitive Services credentials not configured");
    }

    // Call Azure Face API to detect emotions
    const response = await fetch(`${AZURE_COGNITIVE_ENDPOINT}/face/v1.0/detect?returnFaceAttributes=emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': AZURE_API_KEY,
      },
      body: image,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure API error:', error);
      throw new Error(`Failed to analyze emotion: ${error}`);
    }

    const emotionData = await response.json();
    console.log('Emotion analysis result:', emotionData);

    // Store the emotion analysis result
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('emotion_analysis')
      .insert({
        user_id: userId,
        persona_id: personaId,
        emotion_data: emotionData,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ success: true, data: emotionData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-emotion function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to analyze emotion",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});