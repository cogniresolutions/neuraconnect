import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Processing realtime chat request...');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { persona } = await req.json();
    console.log('Generating token for persona:', persona);

    // Map voice style to supported OpenAI voices
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

    // Get mapped voice or default to 'alloy'
    const mappedVoice = voiceMapping[persona.voice_style] || 'alloy';
    console.log('Mapped voice style:', persona.voice_style, 'to:', mappedVoice);

    // Request an ephemeral token from OpenAI with detailed error logging
    console.log('Requesting ephemeral token from OpenAI...');
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: mappedVoice,
        instructions: `You are ${persona.name}, an AI assistant with the following personality: ${persona.personality}. 
                      You have expertise in: ${JSON.stringify(persona.skills)}. 
                      You should focus on discussing topics related to: ${persona.topics?.join(', ') || 'general topics'}.`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: Object.fromEntries(response.headers)
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created successfully:", {
      sessionId: data.session_id,
      expiresAt: data.expires_at
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in realtime chat:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});