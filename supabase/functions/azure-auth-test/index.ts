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
    const azureOpenAIEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');
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
      const baseResponse = await fetch(`${azureOpenAIEndpoint}/openai/deployments?api-version=2024-02-15-preview`, {
        headers: {
          'api-key': azureOpenAIKey,
        },
      });

      console.log('Base connectivity response status:', baseResponse.status);
      results.push({
        service: 'Azure OpenAI Base Connectivity',
        status: baseResponse.ok ? 'success' : 'error',
        error: baseResponse.ok ? undefined : await baseResponse.text()
      });
    } catch (error) {
      console.error('Azure OpenAI base connectivity error:', error);
      results.push({
        service: 'Azure OpenAI Base Connectivity',
        status: 'error',
        error: error.message
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

      console.log('GPT-4 Mini response status:', miniResponse.status);
      results.push({
        service: 'GPT-4 Mini Deployment',
        status: miniResponse.ok ? 'success' : 'error',
        error: miniResponse.ok ? undefined : await miniResponse.text()
      });
    } catch (error) {
      console.error('GPT-4 Mini deployment error:', error);
      results.push({
        service: 'GPT-4 Mini Deployment',
        status: 'error',
        error: error.message
      });
    }

    // Test Realtime Preview Deployment
    try {
      console.log('Testing Realtime Preview deployment token generation...');
      const tokenUrl = `${azureOpenAIEndpoint}/openai/deployments/gpt-4-realtime-preview/chat/realtime/token?api-version=2024-02-15-preview`;
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'api-key': azureOpenAIKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: "alloy"
        })
      });

      console.log('Realtime Preview token response status:', tokenResponse.status);
      results.push({
        service: 'Realtime Preview Deployment',
        status: tokenResponse.ok ? 'success' : 'error',
        error: tokenResponse.ok ? undefined : await tokenResponse.text()
      });
    } catch (error) {
      console.error('Realtime Preview deployment error:', error);
      results.push({
        service: 'Realtime Preview Deployment',
        status: 'error',
        error: error.message
      });
    }

    // Test Speech Services
    try {
      console.log('Testing Speech Services...');
      const speechResponse = await fetch(`${speechEndpoint}/cognitiveservices/voices/list`, {
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey
        }
      });

      console.log('Speech Services response status:', speechResponse.status);
      results.push({
        service: 'Speech Services',
        status: speechResponse.ok ? 'success' : 'error',
        error: speechResponse.ok ? undefined : await speechResponse.text()
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