import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Azure Auth Test Function loaded');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Starting Azure authentication test...');

    const results = [];
    
    // Check Cognitive Services credentials
    const cognitiveKey = Deno.env.get('AZURE_COGNITIVE_KEY');
    const cognitiveEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT');
    console.log('Checking Cognitive Services credentials:', {
      hasCognitiveKey: !!cognitiveKey,
      hasCognitiveEndpoint: !!cognitiveEndpoint
    });

    results.push({
      service: 'Cognitive Services',
      status: cognitiveKey && cognitiveEndpoint ? 'success' : 'error',
      error: !cognitiveKey || !cognitiveEndpoint ? 
        'Missing required credentials' : undefined
    });

    // Check Speech Services credentials
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');
    console.log('Checking Speech Services credentials:', {
      hasSpeechKey: !!speechKey,
      hasSpeechEndpoint: !!speechEndpoint
    });

    results.push({
      service: 'Speech Services',
      status: speechKey && speechEndpoint ? 'success' : 'error',
      error: !speechKey || !speechEndpoint ? 
        'Missing required credentials' : undefined
    });

    // Check Vision Services credentials
    const visionKey = Deno.env.get('AZURE_VISION_KEY');
    const visionEndpoint = Deno.env.get('AZURE_VISION_ENDPOINT');
    console.log('Checking Vision Services credentials:', {
      hasVisionKey: !!visionKey,
      hasVisionEndpoint: !!visionEndpoint
    });

    results.push({
      service: 'Vision Services',
      status: visionKey && visionEndpoint ? 'success' : 'error',
      error: !visionKey || !visionEndpoint ? 
        'Missing required credentials' : undefined
    });

    console.log('Authentication test completed. Results:', results);

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in Azure auth test:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});