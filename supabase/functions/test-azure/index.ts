import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Azure Test Function loaded');

serve(async (req) => {
  console.log('Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Parsing request body...');
    const body = await req.json();
    console.log('Request body:', body);

    // Get Azure credentials
    const cognitiveEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')?.replace(/\/$/, '');
    const cognitiveKey = Deno.env.get('AZURE_COGNITIVE_KEY');
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')?.replace(/\/$/, '');
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const visionEndpoint = Deno.env.get('AZURE_VISION_ENDPOINT')?.replace(/\/$/, '');
    const visionKey = Deno.env.get('AZURE_VISION_KEY');

    console.log('Checking Azure credentials...');
    console.log({
      hasCognitiveEndpoint: !!cognitiveEndpoint,
      hasCognitiveKey: !!cognitiveKey,
      hasSpeechEndpoint: !!speechEndpoint,
      hasSpeechKey: !!speechKey,
      hasVisionEndpoint: !!visionEndpoint,
      hasVisionKey: !!visionKey
    });

    if (!cognitiveEndpoint || !cognitiveKey || !speechEndpoint || !speechKey || !visionEndpoint || !visionKey) {
      console.error('Missing required Azure credentials');
      return new Response(
        JSON.stringify({
          error: 'Missing required Azure credentials',
          details: 'Please check your Azure configuration in Supabase Edge Function secrets'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const results = [];

    // Test Cognitive Services
    try {
      console.log('Testing Cognitive Services...');
      const cognitiveUrl = `${cognitiveEndpoint}/vision/v3.2/analyze?visualFeatures=Description`;
      console.log('Cognitive Services URL:', cognitiveUrl);
      
      const cognitiveResponse = await fetch(cognitiveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': cognitiveKey
        },
        body: JSON.stringify({
          url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
        })
      });

      console.log('Cognitive Services response status:', cognitiveResponse.status);
      const cognitiveData = await cognitiveResponse.text();
      console.log('Cognitive Services response:', cognitiveData);

      results.push({
        service: 'Cognitive Services',
        status: cognitiveResponse.ok ? 'success' : 'error',
        statusCode: cognitiveResponse.status,
        error: cognitiveResponse.ok ? undefined : cognitiveData
      });
    } catch (error) {
      console.error('Cognitive Services error:', error);
      results.push({
        service: 'Cognitive Services',
        status: 'error',
        error: error.message
      });
    }

    // Test Speech Services
    try {
      console.log('Testing Speech Services...');
      // Extract region from speech endpoint
      const region = speechEndpoint.match(/https:\/\/([^.]+)\./)?.[1] || 'eastus';
      const speechUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
      console.log('Speech Services URL:', speechUrl);
      
      const speechResponse = await fetch(speechUrl, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey
        }
      });

      console.log('Speech Services response status:', speechResponse.status);
      const speechData = await speechResponse.text();
      console.log('Speech Services response:', speechData);

      results.push({
        service: 'Speech Services',
        status: speechResponse.ok ? 'success' : 'error',
        statusCode: speechResponse.status,
        error: speechResponse.ok ? undefined : speechData
      });
    } catch (error) {
      console.error('Speech Services error:', error);
      results.push({
        service: 'Speech Services',
        status: 'error',
        error: error.message
      });
    }

    // Test Vision Services
    try {
      console.log('Testing Vision Services...');
      const visionUrl = `${visionEndpoint}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags`;
      console.log('Vision Services URL:', visionUrl);
      
      const visionResponse = await fetch(visionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': visionKey
        },
        body: JSON.stringify({
          url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
        })
      });

      console.log('Vision Services response status:', visionResponse.status);
      const visionData = await visionResponse.text();
      console.log('Vision Services response:', visionData);

      results.push({
        service: 'Vision Services',
        status: visionResponse.ok ? 'success' : 'error',
        statusCode: visionResponse.status,
        error: visionResponse.ok ? undefined : visionData
      });
    } catch (error) {
      console.error('Vision Services error:', error);
      results.push({
        service: 'Vision Services',
        status: 'error',
        error: error.message
      });
    }

    console.log('All tests completed. Results:', results);
    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Fatal error in Azure test function:', error);
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