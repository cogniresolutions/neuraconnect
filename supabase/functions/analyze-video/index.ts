import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const azureEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT');
const azureKey = Deno.env.get('AZURE_COGNITIVE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    // Remove data URL prefix to get base64 string
    const base64Image = imageData.split(',')[1];
    
    // Convert base64 to binary
    const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

    const analyzeUrl = `${azureEndpoint}/vision/v3.2/analyze?visualFeatures=Objects,Scenes,Tags`;
    
    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': azureKey,
      },
      body: imageBuffer,
    });

    const analysisResult = await response.json();
    console.log('Azure Analysis Result:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});