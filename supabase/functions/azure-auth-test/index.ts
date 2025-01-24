import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Azure Auth Test Function loaded');

serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log('Starting Azure authentication test...');

    // Get Azure credentials
    const azureOpenAIKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    const azureOpenAIEndpoint = 'https://neuraconnect.openai.azure.com';
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    console.log('Checking Azure credentials:', {
      hasOpenAIKey: !!azureOpenAIKey,
      hasOpenAIEndpoint: !!azureOpenAIEndpoint,
      hasSpeechKey: !!speechKey,
      hasSpeechEndpoint: !!speechEndpoint,
    });

    const results = [];

    // Test Azure OpenAI Base Connectivity
    try {
      console.log('Testing Azure OpenAI base connectivity...');
      console.log('Using endpoint:', azureOpenAIEndpoint);
      
      // Update the API version to the latest
      const baseResponse = await fetch(`${azureOpenAIEndpoint}/openai/models?api-version=2024-02-15-preview`, {
        headers: {
          'api-key': azureOpenAIKey,
          'Content-Type': 'application/json',
        },
      });

      const baseResponseText = await baseResponse.text();
      console.log('Base connectivity response status:', baseResponse.status);
      console.log('Base connectivity response:', baseResponseText);

      results.push({
        service: 'Azure OpenAI Base Connectivity',
        status: baseResponse.ok ? 'success' : 'error',
        statusCode: baseResponse.status,
        error: baseResponse.ok ? undefined : `Error ${baseResponse.status}: ${baseResponseText}`
      });
    } catch (error) {
      console.error('Azure OpenAI base connectivity error:', error);
      results.push({
        service: 'Azure OpenAI Base Connectivity',
        status: 'error',
        error: `Connection failed: ${error.message}`
      });
    }

    // Test GPT-4 Mini Deployment
    try {
      console.log('Testing GPT-4 Mini deployment...');
      const miniResponse = await fetch(`${azureOpenAIEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'api-key': azureOpenAIKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      const miniResponseText = await miniResponse.text();
      console.log('GPT-4 Mini response status:', miniResponse.status);
      console.log('GPT-4 Mini response:', miniResponseText);

      results.push({
        service: 'GPT-4 Mini Deployment',
        status: miniResponse.ok ? 'success' : 'error',
        statusCode: miniResponse.status,
        error: miniResponse.ok ? undefined : miniResponseText
      });
    } catch (error) {
      console.error('GPT-4 Mini deployment error:', error);
      results.push({
        service: 'GPT-4 Mini Deployment',
        status: 'error',
        error: error.message
      });
    }

    // Test Speech Services
    try {
      console.log('Testing Speech Services...');
      if (!speechEndpoint || !speechKey) {
        throw new Error('Speech credentials not configured');
      }

      // Validate Speech Services endpoint format
      if (!speechEndpoint.includes('tts.speech.microsoft.com')) {
        throw new Error('Invalid Speech Services endpoint. The endpoint should be in the format: https://{region}.tts.speech.microsoft.com/');
      }

      // Use the voices/list endpoint for testing
      const voicesEndpoint = `${speechEndpoint}cognitiveservices/voices/list`;
      console.log('Testing Speech Services endpoint:', voicesEndpoint);
      
      const speechResponse = await fetch(voicesEndpoint, {
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
        }
      });

      const speechResponseText = await speechResponse.text();
      console.log('Speech Services response status:', speechResponse.status);
      console.log('Speech Services response:', speechResponseText);

      // Try to parse the response to see if it's valid JSON
      try {
        JSON.parse(speechResponseText);
      } catch (e) {
        console.error('Failed to parse Speech Services response:', e);
        throw new Error('Invalid response from Speech Services. Please verify the endpoint is correct: https://{region}.tts.speech.microsoft.com/');
      }

      results.push({
        service: 'Speech Services',
        status: speechResponse.ok ? 'success' : 'error',
        statusCode: speechResponse.status,
        error: speechResponse.ok ? undefined : speechResponseText
      });
    } catch (error) {
      console.error('Speech Services error:', error);
      results.push({
        service: 'Speech Services',
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
