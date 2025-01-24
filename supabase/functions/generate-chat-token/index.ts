import { corsHeaders } from '../_shared/cors.ts';

const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY');
const AZURE_SPEECH_ENDPOINT = Deno.env.get('AZURE_SPEECH_ENDPOINT');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { personaId, config } = await req.json();
    console.log('Validating Azure services for persona:', personaId);

    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    // Validate all required Azure credentials
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      console.error('Missing Azure OpenAI credentials');
      throw new Error('Azure OpenAI credentials not configured');
    }

    if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_ENDPOINT) {
      console.error('Missing Azure Speech credentials');
      throw new Error('Azure Speech credentials not configured');
    }

    // Test Azure OpenAI Connection
    try {
      console.log('Testing Azure OpenAI connection...');
      const openAiResponse = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments?api-version=2024-02-15-preview`, {
        headers: {
          'api-key': AZURE_OPENAI_API_KEY,
        },
      });

      if (!openAiResponse.ok) {
        const error = await openAiResponse.text();
        console.error('Azure OpenAI validation failed:', error);
        throw new Error(`Failed to validate Azure OpenAI: ${error}`);
      }

      const deployments = await openAiResponse.json();
      console.log('Available OpenAI deployments:', deployments);

      // Verify specific model deployment exists
      const hasRequiredModel = deployments.data.some(
        (deployment: any) => deployment.model === 'gpt-4o-mini'
      );

      if (!hasRequiredModel) {
        throw new Error('Required GPT-4o-mini model deployment not found');
      }
    } catch (error) {
      console.error('Error validating Azure OpenAI:', error);
      throw error;
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
        console.error('Azure Speech Services validation failed:', error);
        throw new Error(`Failed to validate Azure Speech Services: ${error}`);
      }

      console.log('Azure Speech Services validated successfully');
    } catch (error) {
      console.error('Error validating Azure Speech Services:', error);
      throw error;
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