import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Text-to-Speech Function loaded');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Parse and validate request
    console.log('Starting text-to-speech synthesis...');
    const { text, voice } = await req.json();
    console.log('Request payload:', { text, voice });

    if (!text) {
      throw new Error('Missing required field: text');
    }

    // Step 2: Get and validate Azure credentials
    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    console.log('Checking Azure Speech credentials:', {
      hasKey: !!azureSpeechKey,
      hasEndpoint: !!azureSpeechEndpoint
    });

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      throw new Error('Azure Speech credentials not configured');
    }

    // Step 3: Construct the correct endpoint URL according to Azure docs
    const endpoint = new URL(azureSpeechEndpoint);
    const ttsEndpoint = `${endpoint.origin}/cognitiveservices/v1`;
    console.log('Using TTS endpoint:', ttsEndpoint);

    // Step 4: Format voice name according to Azure standards
    const formattedVoice = voice ? voice.charAt(0).toUpperCase() + voice.slice(1).toLowerCase() : 'Jenny';
    const voiceName = `en-US-${formattedVoice}Neural`;
    console.log('Using voice:', voiceName);

    // Step 5: Prepare SSML with proper XML escaping
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Construct SSML according to Azure documentation
    const ssml = `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis'><voice name='${voiceName}'>${escapedText}</voice></speak>`;
    console.log('SSML payload:', ssml);

    // Step 6: Make request to Azure TTS
    console.log('Making request to Azure TTS...');
    const response = await fetch(ttsEndpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LovableAI'
      },
      body: ssml
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText,
        endpoint: ttsEndpoint,
        ssml: ssml
      });
      throw new Error(`Text-to-speech synthesis failed: ${response.status} - ${errorText}`);
    }

    // Step 7: Process successful response
    console.log('Successfully received audio response');
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Audio = btoa(String.fromCharCode(...uint8Array));

    console.log('Successfully converted audio to base64, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: base64Audio,
        metadata: {
          voice: voiceName,
          endpoint: ttsEndpoint,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Text-to-speech error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});