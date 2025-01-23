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

    console.log('Checking Azure Speech credentials:', {
      hasKey: !!azureSpeechKey,
      hasEndpoint: !!azureSpeechEndpoint
    });

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      throw new Error('Azure Speech credentials not configured');
    }

    // First test the voices list endpoint
    console.log('Testing voices list endpoint...');
    const voicesResponse = await fetch(`${azureSpeechEndpoint}/cognitiveservices/voices/list/v1`, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
      },
    });

    if (!voicesResponse.ok) {
      console.error('Failed to fetch voices:', voicesResponse.status, voicesResponse.statusText);
      const errorText = await voicesResponse.text();
      console.error('Error details:', errorText);
      throw new Error(`Failed to fetch voices: ${voicesResponse.statusText}`);
    }

    const voices = await voicesResponse.json();
    console.log('Successfully retrieved voices:', voices.length);

    // Now test text-to-speech with a simple SSML payload
    console.log('Testing text-to-speech synthesis...');
    const ssml = `
      <speak version='1.0' xml:lang='en-US'>
        <voice name='en-US-JennyNeural'>
          This is a test of the Azure Speech Services connection.
        </voice>
      </speak>
    `.trim();

    const ttsResponse = await fetch(`${azureSpeechEndpoint}/cognitiveservices/v1/synthesize`, {
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

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('TTS error:', {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        errorText
      });
      throw new Error(`Text-to-speech synthesis failed: ${ttsResponse.statusText}`);
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
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});