import { corsHeaders } from '../_shared/cors.ts';

const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { personaId, config } = await req.json();
    console.log('Received request for persona:', personaId, 'with config:', config);

    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    // Generate a simple token for now (this should be more secure in production)
    const token = crypto.randomUUID();
    
    console.log('Generated token for persona:', personaId);

    return new Response(
      JSON.stringify({ 
        token,
        personaId,
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
        timestamp: new Date().toISOString(),
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