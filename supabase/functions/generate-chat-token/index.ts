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
    const AZURE_OPENAI_ENDPOINT = 'https://neuraconnect.openai.azure.com';

    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
      console.error('Azure OpenAI credentials are not configured');
      throw new Error('Azure OpenAI credentials are not configured');
    }

    const { personaId, config } = await req.json();
    console.log('Generating token for persona:', personaId, 'with config:', config);

    // Request a token from Azure OpenAI with correct API version and deployment
    const tokenUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview`;
    console.log('Requesting token from:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          role: "system",
          content: `You are ${config.name}, an AI assistant with the following personality: ${config.personality}. You have expertise in: ${JSON.stringify(config.skills)}. You should focus on discussing topics related to: ${config.topics.join(', ')}.`
        }],
        max_tokens: 800,
        temperature: 0.7,
        stream: true
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure OpenAI token generation error:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      throw new Error(`Failed to generate token: ${error}`);
    }

    const data = await response.json();
    console.log("Token generated successfully");

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