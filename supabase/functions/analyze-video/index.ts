import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const azureEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT');
const azureKey = Deno.env.get('AZURE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, personaId, userId } = await req.json();
    
    if (!azureEndpoint || !azureKey) {
      throw new Error('Azure credentials not configured');
    }

    // Analyze environment using Azure Computer Vision
    const visionResponse = await fetch(`${azureEndpoint}/vision/v3.2/analyze?visualFeatures=Objects,Scenes,Tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': azureKey,
      },
      body: Uint8Array.from(atob(imageData.split(',')[1]), c => c.charCodeAt(0))
    });

    if (!visionResponse.ok) {
      throw new Error(`Azure Vision API error: ${await visionResponse.text()}`);
    }

    const visionData = await visionResponse.json();
    console.log('Environment analysis:', visionData);

    // Analyze facial expressions using Azure Face API
    const faceResponse = await fetch(`${azureEndpoint}/face/v1.0/detect?returnFaceAttributes=emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': azureKey,
      },
      body: Uint8Array.from(atob(imageData.split(',')[1]), c => c.charCodeAt(0))
    });

    if (!faceResponse.ok) {
      throw new Error(`Azure Face API error: ${await faceResponse.text()}`);
    }

    const faceData = await faceResponse.json();
    console.log('Emotion analysis:', faceData);

    // Store analysis results in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('emotion_analysis')
      .insert({
        user_id: userId,
        persona_id: personaId,
        emotion_data: faceData,
        environment_data: visionData,
        environment_context: {
          objects: visionData.objects,
          scenes: visionData.scenes,
          tags: visionData.tags
        }
      });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        emotions: faceData,
        environment: visionData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});