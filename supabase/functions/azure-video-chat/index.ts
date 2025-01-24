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
    const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY');
    const AZURE_SPEECH_ENDPOINT = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_SPEECH_KEY || !AZURE_SPEECH_ENDPOINT) {
      throw new Error('Azure credentials are not configured');
    }

    const { text, persona } = await req.json();
    console.log('Processing chat request for persona:', persona?.name);

    // Get response from Azure OpenAI
    const openaiResponse = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'api-key': AZURE_OPENAI_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are ${persona.name}, an AI assistant with the following personality: ${persona.personality}. 
                       You have expertise in: ${JSON.stringify(persona.skills)}. 
                       You should focus on discussing topics related to: ${persona.topics.join(', ')}.`
            },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`Azure OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices[0].message.content;

    // Convert response to speech using Azure Speech Services
    const ssml = `
      <speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis'>
        <voice name='${persona.voice_style || 'en-US-JennyNeural'}'>
          ${responseText}
        </voice>
      </speak>
    `;

    const speechResponse = await fetch(
      `${AZURE_SPEECH_ENDPOINT}/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'LovableAI'
        },
        body: ssml
      }
    );

    if (!speechResponse.ok) {
      const error = await speechResponse.text();
      throw new Error(`Azure Speech API error: ${error}`);
    }

    const audioArrayBuffer = await speechResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));

    return new Response(
      JSON.stringify({ 
        text: responseText,
        audio: audioBase64,
        metadata: {
          timestamp: new Date().toISOString(),
          model: 'gpt-4o-mini',
          voice: persona.voice_style || 'en-US-JennyNeural'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in azure-video-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});