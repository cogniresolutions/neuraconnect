import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { persona } = await req.json();
    console.log('Received persona:', persona);

    if (!persona) {
      throw new Error('No persona data provided');
    }

    // Validate and normalize voice parameter
    let voice = persona.voice_style || 'alloy';
    if (!VALID_VOICES.includes(voice)) {
      console.warn(`Invalid voice "${voice}" provided, defaulting to "alloy"`);
      voice = 'alloy';
    }

    // Request a session from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: persona.model_config?.model || "gpt-4o-mini",
        voice: voice,
        instructions: `You are ${persona.name}, ${persona.description || ''}. 
                      Your personality is: ${persona.personality || ''}.
                      Your skills include: ${(persona.skills || []).join(', ')}.
                      You are knowledgeable about: ${(persona.topics || []).join(', ')}.`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Session created:", data);

    if (!data.url) {
      throw new Error('No WebSocket URL received from OpenAI');
    }

    return new Response(JSON.stringify({ url: data.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});