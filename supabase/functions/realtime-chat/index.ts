import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function validateVoice(voice: string): string {
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  return validVoices.includes(voice) ? voice : 'alloy';
}

function formatInstructions(persona: any): string {
  const instructions = [
    `You are ${persona.name}.`,
    persona.description ? `Description: ${persona.description}` : '',
    persona.personality ? `Personality: ${persona.personality}` : '',
    persona.skills?.length > 0 ? `Skills: ${persona.skills.join(', ')}` : '',
    persona.topics?.length > 0 ? `Topics: ${persona.topics.join(', ')}` : '',
    `Always stay in character and respond as ${persona.name}.`
  ].filter(Boolean).join('\n');

  console.log('Formatted instructions:', instructions);
  return instructions;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { persona } = await req.json();
    console.log('Received request for persona:', persona);

    if (!persona || !persona.name) {
      throw new Error('Invalid persona data');
    }

    const voice = validateVoice(persona.voice_style);
    console.log('Using voice:', voice);

    const instructions = formatInstructions(persona);
    console.log('Using instructions:', instructions);

    const requestBody = {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: voice,
      instructions: instructions,
      voice_mode: "chat",
      session_mode: "conversation"
    };

    console.log('OpenAI request payload:', JSON.stringify(requestBody, null, 2));

    // Request a session from OpenAI using the realtime API endpoint
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    // Check if we have a valid session ID and client secret
    if (!data.id || !data.client_secret?.value) {
      console.error('Invalid response from OpenAI:', data);
      throw new Error('No valid session data received from OpenAI');
    }

    // Construct WebSocket URL using session ID and client secret
    const wsUrl = `wss://api.openai.com/v1/realtime/sessions/${data.id}/ws?client_secret=${data.client_secret.value}`;
    console.log('Constructed WebSocket URL:', wsUrl);

    return new Response(
      JSON.stringify({ url: wsUrl, session: data }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in realtime-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});