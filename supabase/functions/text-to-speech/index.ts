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
    console.log('Starting text-to-speech synthesis...');
    
    // Step 1: Parse and validate request
    const { text, voice } = await req.json();
    console.log('Request payload:', { text, voice });

    if (!text || !voice) {
      throw new Error('Missing required fields: text and voice are required');
    }

    // Step 2: Get and validate Azure credentials
    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    console.log('Checking Azure Speech credentials:', {
      hasKey: !!azureSpeechKey,
      hasEndpoint: !!azureSpeechEndpoint,
      endpoint: azureSpeechEndpoint
    });

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      throw new Error('Azure Speech credentials not configured');
    }

    // Step 3: Ensure the endpoint is using tts instead of stt
    const ttsEndpoint = azureSpeechEndpoint.replace('stt.speech', 'tts.speech');
    console.log('Using TTS endpoint:', ttsEndpoint);

    // Step 4: Map voice name to Azure format
    const voiceName = `en-US-${voice}Neural`;
    console.log('Using voice:', voiceName);

    // Step 5: Prepare SSML with proper formatting
    const ssml = `
<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
  <voice name='${voiceName}'>
    <prosody rate="0%">${text}</prosody>
  </voice>
</speak>`.trim();

    console.log('SSML payload:', ssml);

    // Step 6: Make request to Azure TTS
    console.log('Making request to Azure TTS...');
    const response = await fetch(`${ttsEndpoint}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LovableAI'
      },
      body: ssml
    });

    console.log('TTS response status:', response.status);
    console.log('TTS response headers:', Object.fromEntries(response.headers.entries()));

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
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
        timestamp: new Date().toISOString(),
        details: {
          stack: error.stack,
          name: error.name
        }
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});