import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting video analysis...');
    const { imageData, personaId, userId } = await req.json();
    
    if (!imageData || !personaId || !userId) {
      console.error('Missing required parameters:', { hasImageData: !!imageData, hasPersonaId: !!personaId, hasUserId: !!userId });
      throw new Error('Missing required parameters');
    }

    const azureEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT');
    const azureKey = Deno.env.get('AZURE_COGNITIVE_KEY');

    if (!azureEndpoint || !azureKey) {
      console.error('Azure credentials not configured');
      throw new Error('Azure credentials not configured');
    }

    console.log('Analyzing environment using Azure Computer Vision...');
    
    try {
      // Convert base64 to binary
      const base64Data = imageData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data format');
      }
      
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Analyze environment using Azure Computer Vision
      const visionResponse = await fetch(`${azureEndpoint}/vision/v3.2/analyze?visualFeatures=Objects,Scenes,Tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': azureKey,
        },
        body: binaryData
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error('Azure Vision API error:', errorText);
        throw new Error(`Azure Vision API error: ${errorText}`);
      }

      const visionData = await visionResponse.json();
      console.log('Environment analysis completed:', visionData);

      // Analyze facial expressions using Azure Face API
      console.log('Analyzing facial expressions...');
      const faceResponse = await fetch(`${azureEndpoint}/face/v1.0/detect?returnFaceAttributes=emotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': azureKey,
        },
        body: binaryData
      });

      if (!faceResponse.ok) {
        const errorText = await faceResponse.text();
        console.error('Azure Face API error:', errorText);
        throw new Error(`Azure Face API error: ${errorText}`);
      }

      const faceData = await faceResponse.json();
      console.log('Facial expression analysis completed:', faceData);

      // Store analysis results in Supabase
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      console.log('Storing analysis results in database...');
      const { error: dbError } = await supabase
        .from('emotion_analysis')
        .insert({
          user_id: userId,
          persona_id: personaId,
          emotion_data: faceData,
          environment_data: visionData,
          environment_context: {
            objects: visionData.objects || [],
            scenes: visionData.scenes || [],
            tags: visionData.tags || []
          }
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Analysis completed successfully');
      return new Response(
        JSON.stringify({
          emotions: faceData[0]?.faceAttributes?.emotion || {},
          environment: {
            objects: visionData.objects || [],
            scenes: visionData.scenes || [],
            tags: visionData.tags || []
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } catch (error) {
      console.error('Error in video analysis:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});