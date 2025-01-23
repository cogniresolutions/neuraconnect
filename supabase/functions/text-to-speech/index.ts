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
    // Step 1: Validate request payload
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Received request payload:', requestBody);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid request body: ' + error.message);
    }

    const { text, voice } = requestBody;
    
    // Validate required fields
    if (!text) {
      console.error('Missing required field: text');
      throw new Error('Text is required');
    }
    if (!voice) {
      console.error('Missing required field: voice');
      throw new Error('Voice is required');
    }

    // Step 2: Validate Azure credentials
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

    // Step 3: Prepare Azure endpoint
    const baseEndpoint = azureSpeechEndpoint.replace('stt.speech', 'tts.speech').replace(/\/$/, '');
    console.log('Base endpoint:', baseEndpoint);

    // Step 4: Test Azure connectivity
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
    const voices = await testResponse.json();
    console.log('Available voices:', voices.length);

    // Step 5: Prepare TTS request
    const voiceName = `en-US-${voice}Neural`;
    console.log('Using voice:', voiceName);

    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='${voiceName}'>
          <prosody rate="0%">
            ${text}
          </prosody>
        </voice>
      </speak>`.trim();
    
    console.log('SSML payload:', ssml);

    // Step 6: Make TTS request
    const ttsUrl = `${baseEndpoint}/cognitiveservices/v1`;
    console.log('TTS URL:', ttsUrl);
    console.log('Request headers:', {
      'Ocp-Apim-Subscription-Key': 'present',
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
    });

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

    // Step 7: Process and return response
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
          endpoint: baseEndpoint,
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