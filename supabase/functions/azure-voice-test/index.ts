import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Azure Voice Test Function loaded');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Azure Speech Services test...');
    
    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    // Validate environment variables
    console.log('Checking Azure Speech credentials:', {
      hasKey: !!azureSpeechKey,
      hasEndpoint: !!azureSpeechEndpoint,
      endpoint: azureSpeechEndpoint
    });

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      throw new Error('Azure Speech credentials not configured');
    }

    // Validate endpoint format - more lenient check
    if (!azureSpeechEndpoint.startsWith('https://') || !azureSpeechEndpoint.includes('.speech.microsoft.com')) {
      throw new Error('Invalid Azure Speech endpoint format. Expected: https://<region>.speech.microsoft.com');
    }

    // Test voices list endpoint
    console.log('Testing voices list endpoint...');
    const voicesUrl = `${azureSpeechEndpoint}/cognitiveservices/voices/list`;
    console.log('Voices URL:', voicesUrl);
    
    const voicesResponse = await fetch(voicesUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
      },
    });

    if (!voicesResponse.ok) {
      const errorText = await voicesResponse.text();
      console.error('Failed to fetch voices:', {
        status: voicesResponse.status,
        statusText: voicesResponse.statusText,
        headers: Object.fromEntries(voicesResponse.headers.entries()),
        error: errorText,
        url: voicesUrl
      });
      throw new Error(`Failed to fetch voices: ${voicesResponse.status} - ${errorText}`);
    }

    const voices = await voicesResponse.json();
    console.log('Successfully retrieved voices:', voices.length);

    // Test text-to-speech with proper SSML
    console.log('Testing text-to-speech synthesis...');
    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='en-US-JennyNeural'>
          <prosody rate="0%">
            This is a test of the Azure Speech Services connection.
          </prosody>
        </voice>
      </speak>
    `.trim();

    const ttsUrl = `${azureSpeechEndpoint}/cognitiveservices/v1`;
    console.log('TTS URL:', ttsUrl);
    console.log('SSML Payload:', ssml);

    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LovableAI'
      },
      body: ssml
    });

    console.log('TTS response status:', ttsResponse.status);
    console.log('TTS response headers:', Object.fromEntries(ttsResponse.headers.entries()));

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('TTS error:', {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        headers: Object.fromEntries(ttsResponse.headers.entries()),
        error: errorText,
        url: ttsUrl
      });
      throw new Error(`Text-to-speech synthesis failed: ${ttsResponse.status} - ${errorText}`);
    }

    const arrayBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Successfully generated audio, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Azure Speech Services tests passed successfully',
        voicesAvailable: voices.length,
        audioContent: base64Audio
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in Azure voice test:', error);
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});