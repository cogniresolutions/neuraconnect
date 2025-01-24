import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const AZURE_OPENAI_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY');
    const AZURE_SPEECH_ENDPOINT = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_SPEECH_KEY || !AZURE_SPEECH_ENDPOINT) {
      console.error('Missing Azure credentials');
      throw new Error('Azure credentials are not configured');
    }

    const { action, personaId, personaConfig } = await req.json();
    console.log('Processing request:', { action, personaId, personaConfig });

    if (action !== 'initialize') {
      throw new Error('Invalid action specified');
    }

    if (!personaId || !personaConfig) {
      throw new Error('Missing required parameters');
    }

    // Initialize Azure services and return configuration
    const config = {
      openai: {
        endpoint: AZURE_OPENAI_ENDPOINT,
        model: 'gpt-4o-mini',
        maxTokens: 800,
      },
      speech: {
        endpoint: AZURE_SPEECH_ENDPOINT,
        voice: personaConfig.voice || 'en-US-JennyNeural',
      },
      persona: {
        id: personaId,
        ...personaConfig,
      },
      sessionId: crypto.randomUUID(),
    };

    console.log('Initialization successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        config,
        message: 'Azure services initialized successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in azure-video-chat function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});