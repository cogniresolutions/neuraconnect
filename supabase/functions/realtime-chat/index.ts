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
      console.error('Azure OpenAI credentials are not set');
      throw new Error('Azure OpenAI credentials are not set');
    }

    const { persona } = await req.json();
    console.log('Generating token for persona:', persona);

    // Map voice style to supported Azure OpenAI voices
    const voiceMapping: { [key: string]: string } = {
      'Jason': 'echo',     // Male voice
      'Jenny': 'shimmer',  // Female voice
      'Guy': 'echo',       // Male voice
      'Aria': 'shimmer',   // Female voice
      'Davis': 'echo',     // Male voice
      'Jane': 'shimmer',   // Female voice
      'Tony': 'echo',      // Male voice
      'Nancy': 'shimmer',  // Female voice
      'Sara': 'shimmer',   // Female voice
      'Brandon': 'echo'    // Male voice
    };

    const mappedVoice = voiceMapping[persona.voice_style] || 'alloy';
    console.log('Mapped voice style:', persona.voice_style, 'to:', mappedVoice);

    const tokenUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o-realtime-preview/chat/realtime/token?api-version=2024-12-17`;
    console.log('Requesting token from:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice: mappedVoice,
        instructions: `You are ${persona.name}, an AI assistant with the following personality: ${persona.personality}. 
                      You have expertise in: ${JSON.stringify(persona.skills)}. 
                      You should focus on discussing topics related to: ${persona.topics.join(', ')}.`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Azure OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

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