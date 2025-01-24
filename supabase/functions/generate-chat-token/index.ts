import { corsHeaders } from '../_shared/cors.ts';

const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { personaId, config } = await req.json();
    console.log('Received request for persona:', personaId);

    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      console.error('Missing Azure OpenAI credentials');
      throw new Error('Azure OpenAI credentials not configured');
    }

    // Generate a token using Azure OpenAI credentials
    const token = btoa(`${AZURE_OPENAI_ENDPOINT}:${AZURE_OPENAI_API_KEY}`);
    
    console.log('Successfully generated token for persona:', personaId);

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