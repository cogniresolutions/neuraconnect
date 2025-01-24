import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test, model, apiVersion, temperature, top_p, max_tokens } = await req.json();
    const results = [];

    // Test Azure OpenAI
    try {
      const openaiResponse = await fetch(`${Deno.env.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`, {
        method: 'POST',
        headers: {
          'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          temperature,
          top_p,
          max_tokens,
        }),
      });

      results.push({
        service: 'Azure OpenAI',
        status: openaiResponse.ok ? 'success' : 'error',
        statusCode: openaiResponse.status,
        error: openaiResponse.ok ? null : await openaiResponse.text(),
      });
    } catch (error) {
      results.push({
        service: 'Azure OpenAI',
        status: 'error',
        error: error.message,
      });
    }

    // Test Azure Speech Services
    try {
      const speechResponse = await fetch(`${Deno.env.get('AZURE_SPEECH_ENDPOINT')}/cognitiveservices/voices/list`, {
        headers: {
          'Ocp-Apim-Subscription-Key': Deno.env.get('AZURE_SPEECH_KEY') || '',
        },
      });

      results.push({
        service: 'Azure Speech Services',
        status: speechResponse.ok ? 'success' : 'error',
        statusCode: speechResponse.status,
        error: speechResponse.ok ? null : await speechResponse.text(),
      });
    } catch (error) {
      results.push({
        service: 'Azure Speech Services',
        status: 'error',
        error: error.message,
      });
    }

    // Test Azure Cognitive Services
    try {
      const cognitiveResponse = await fetch(`${Deno.env.get('AZURE_COGNITIVE_ENDPOINT')}/face/v1.0/detect`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': Deno.env.get('AZURE_COGNITIVE_KEY') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com/test.jpg' }),
      });

      results.push({
        service: 'Azure Cognitive Services',
        status: cognitiveResponse.ok ? 'success' : 'error',
        statusCode: cognitiveResponse.status,
        error: cognitiveResponse.ok ? null : await cognitiveResponse.text(),
      });
    } catch (error) {
      results.push({
        service: 'Azure Cognitive Services',
        status: 'error',
        error: error.message,
      });
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error testing Azure services:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});