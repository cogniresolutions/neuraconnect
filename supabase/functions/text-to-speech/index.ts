import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice } = await req.json();
    console.log('Starting text-to-speech synthesis with params:', { text, voice });
    
    if (!text) {
      throw new Error('Text is required');
    }

    // Get Azure credentials and ensure TTS endpoint
    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    // Validate environment variables with detailed logging
    console.log('Checking Azure Speech credentials:', {
      hasKey: !!azureSpeechKey,
      hasEndpoint: !!azureSpeechEndpoint,
      endpoint: azureSpeechEndpoint
    });

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      throw new Error('Azure Speech credentials not configured');
    }

    // Ensure the endpoint is using tts instead of stt and remove trailing slash if present
    const baseEndpoint = azureSpeechEndpoint.replace('stt.speech', 'tts.speech').replace(/\/$/, '');
    console.log('Base endpoint:', baseEndpoint);

    // Test Azure connectivity first using the voices list endpoint
    console.log('Testing Azure Speech Services connectivity...');
    const voicesUrl = `${baseEndpoint}/cognitiveservices/voices/list`;
    console.log('Testing connectivity with URL:', voicesUrl);
    
    const testResponse = await fetch(voicesUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      const errorDetails = {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers.entries()),
        endpoint: baseEndpoint,
        voicesUrl,
        error: errorText
      };
      console.error('Azure connectivity test failed:', errorDetails);
      throw new Error(`Azure Speech Services not available: ${testResponse.status} - ${errorText}`);
    }

    console.log('Azure Speech Services connectivity test passed');

    // Format voice name correctly for Azure
    const voiceName = `en-US-${voice}Neural`;
    console.log('Using voice:', voiceName);

    // Construct SSML with proper XML namespace
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='${voiceName}'>
          <prosody rate="0%">
            ${text}
          </prosody>
        </voice>
      </speak>`.trim();
    
    console.log('SSML payload:', ssml);

    // Test text-to-speech with proper SSML
    const ttsUrl = `${baseEndpoint}/cognitiveservices/v1`;
    console.log('TTS URL:', ttsUrl);

    const response = await fetch(ttsUrl, {
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
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText,
        url: ttsUrl,
        ssml: ssml,
        endpoint: baseEndpoint
      };
      console.error('TTS error details:', errorDetails);
      throw new Error(`Azure TTS Error: ${response.status} - ${errorText}`);
    }

    console.log('Successfully received audio response');

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Successfully converted audio to base64, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: base64Audio 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
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