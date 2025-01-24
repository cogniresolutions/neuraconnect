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
    const AZURE_OPENAI_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');

    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
      console.error('Azure OpenAI credentials are not configured');
      throw new Error('Azure OpenAI credentials are not configured');
    }

    const { personaId, config } = await req.json();
    console.log('Generating token for persona:', personaId, 'with config:', config);

    // Request a token from Azure OpenAI for real-time chat
    // Updated API version and endpoint to match the latest Azure OpenAI specifications
    const tokenUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o-mini/chat/realtime/token?api-version=2024-02-15-preview`;
    console.log('Requesting token from:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice: config.voice || "alloy",
        instructions: `You are ${config.name}, an AI assistant with the following personality: ${config.personality}. You have expertise in: ${JSON.stringify(config.skills)}. You should focus on discussing topics related to: ${config.topics.join(', ')}.`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI token generation error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to generate token: ${errorText}`);
    }

    const data = await response.json();
    console.log('Token generated successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});