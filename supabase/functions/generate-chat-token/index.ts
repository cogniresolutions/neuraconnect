import { corsHeaders } from '../_shared/cors.ts';

const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { personaId, config } = await req.json();
    console.log('Generating chat token for persona:', personaId);

    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      console.error('Missing Azure OpenAI credentials');
      throw new Error('Azure OpenAI credentials not configured');
    }

    // Validate Azure OpenAI deployment
    try {
      const deploymentResponse = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments?api-version=2024-02-15-preview`, {
        headers: {
          'api-key': AZURE_OPENAI_API_KEY,
        },
      });

      if (!deploymentResponse.ok) {
        const error = await deploymentResponse.json();
        console.error('Azure OpenAI deployment validation failed:', error);
        throw new Error('Failed to validate Azure OpenAI deployment');
      }

      const deployments = await deploymentResponse.json();
      console.log('Available deployments:', deployments);

      // Generate a token using Azure OpenAI credentials
      const token = btoa(`${AZURE_OPENAI_ENDPOINT}:${AZURE_OPENAI_API_KEY}`);
      
      return new Response(
        JSON.stringify({ 
          token,
          personaId,
          config,
          timestamp: new Date().toISOString()
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
      console.error('Error validating Azure OpenAI deployment:', error);
      throw error;
    }

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