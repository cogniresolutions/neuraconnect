import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting voice test...');
    const { text, voice, language } = await req.json();
    
    console.log('Request parameters:', { text, voice, language });

    if (!text || !voice) {
      throw new Error('Missing required parameters: text and voice are required');
    }

    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      console.error('Azure Speech credentials not configured');
      throw new Error('Azure Speech credentials not configured');
    }

    console.log('Using voice:', voice);
    console.log('Using language:', language);

    // Prepare SSML with proper XML escaping
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const ssml = `
      <speak version='1.0' xml:lang='${language || 'en-US'}' xmlns='http://www.w3.org/2001/10/synthesis'>
        <voice name='${voice}'>
          ${escapedText}
        </voice>
      </speak>
    `;

    console.log('Sending request to Azure Speech Service...');
    console.log('SSML payload:', ssml);
    
    const response = await fetch(
      `${azureSpeechEndpoint}/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureSpeechKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'LovableAI'
        },
        body: ssml
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Speech error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Speech synthesis failed: ${response.status} - ${errorText}`);
    }

    console.log('Successfully received audio response');
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Audio conversion successful, sending response');
    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: base64Audio
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Voice test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});