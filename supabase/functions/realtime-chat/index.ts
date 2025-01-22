import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'] as const;
type ValidVoice = typeof VALID_VOICES[number];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { persona } = await req.json();
    console.log('Received request for persona:', persona);

    // Validate and normalize voice parameter
    const voice = validateVoice(persona.voice_style);
    console.log('Using voice:', voice);

    // Format instructions for the AI
    const instructions = formatInstructions(persona);
    console.log('Formatted instructions:', instructions);

    // Request a session from OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/chat/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice,
        instructions: instructions
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    // Check if we have a valid session with a client secret
    if (!data.client_secret?.value) {
      console.error('Invalid response from OpenAI - missing client secret:', data);
      throw new Error('No client secret received from OpenAI');
    }

    // Return the WebSocket URL and session data
    return new Response(
      JSON.stringify({ 
        url: `wss://api.openai.com/v1/audio/chat/sessions/${data.id}/ws?client_secret=${data.client_secret.value}`,
        session: data
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in realtime-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function validateVoice(voice: string | null | undefined): ValidVoice {
  if (!voice || !VALID_VOICES.includes(voice as ValidVoice)) {
    console.warn(`Invalid voice "${voice}" provided, defaulting to "alloy"`);
    return 'alloy';
  }
  return voice as ValidVoice;
}

function formatInstructions(persona: any): string {
  const instructions = [
    `You are ${persona.name}, ${persona.description || ''}.`,
    `Your personality is: ${persona.personality || ''}.`,
    `Your skills include: ${JSON.stringify(persona.skills || [])}.`,
    `You are knowledgeable about: ${JSON.stringify(persona.topics || [])}.`
  ].join('\n');

  return instructions;
}