import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY');
const AZURE_SPEECH_ENDPOINT = Deno.env.get('AZURE_SPEECH_ENDPOINT');

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
    const { personaId, config } = await req.json();
    console.log('Validating Azure services for persona:', personaId);

    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      console.error('Missing Azure OpenAI credentials');
      throw new Error('Azure OpenAI credentials not configured');
    }

    if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_ENDPOINT) {
      console.error('Missing Azure Speech credentials');
      throw new Error('Azure Speech credentials not configured');
    }

    // Test Azure OpenAI Connection with specific deployment
    try {
      console.log('Testing Azure OpenAI connection...');
      const deploymentName = 'gpt-4o-mini';
      const apiVersion = '2024-08-01-preview';
      
      // Test the deployment directly with a chat completion request
      const deploymentResponse = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`, {
        method: 'POST',
        headers: {
          'api-key': AZURE_OPENAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'system', content: 'Test connection' }],
          max_tokens: 5,
        }),
      });

      if (!deploymentResponse.ok) {
        const error = await deploymentResponse.text();
        console.error('Deployment test failed:', error);
        throw new Error(`Failed to validate deployment ${deploymentName}: ${error}`);
      }

      console.log(`Azure OpenAI deployment ${deploymentName} validated successfully`);
    } catch (error) {
      console.error('Error validating Azure OpenAI:', error);
      throw new Error(`Failed to validate Azure OpenAI deployment: ${error.message}`);
    }

    // Test Azure Speech Services
    try {
      console.log('Testing Azure Speech Services connection...');
      const speechResponse = await fetch(`${AZURE_SPEECH_ENDPOINT}/cognitiveservices/voices/list`, {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        },
      });

      if (!speechResponse.ok) {
        const error = await speechResponse.text();
        console.error('Speech Services validation failed:', error);
        throw new Error(`Failed to validate Azure Speech Services: ${error}`);
      }

      console.log('Azure Speech Services validated successfully');
    } catch (error) {
      console.error('Error validating Azure Speech Services:', error);
      throw new Error(`Failed to validate Azure Speech Services: ${error.message}`);
    }

    // If all validations pass, generate the token
    console.log('All Azure services validated successfully');
    const token = btoa(`${AZURE_OPENAI_ENDPOINT}:${AZURE_OPENAI_API_KEY}`);

    return new Response(
      JSON.stringify({
        token,
        personaId,
        config,
        timestamp: new Date().toISOString(),
        status: 'success',
        services: {
          openai: true,
          speech: true
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in generate-chat-token:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
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