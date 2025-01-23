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
    // Step 1: Log request details
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Received request payload:', requestBody);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid request body: ' + error.message);
    }

    const { text, voice } = requestBody;
    
    // Step 3: Validate required fields
    if (!text) {
      console.error('Missing required field: text');
      throw new Error('Text is required');
    }
    if (!voice) {
      console.error('Missing required field: voice');
      throw new Error('Voice is required');
    }

    // Step 4: Validate Azure credentials
    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechRegion = 'eastus';

    console.log('Azure Speech credentials:', {
      hasKey: !!azureSpeechKey,
      region: azureSpeechRegion,
      keyLength: azureSpeechKey?.length,
      keyPrefix: azureSpeechKey?.substring(0, 5) + '...'
    });

    if (!azureSpeechKey) {
      throw new Error('Azure Speech credentials not configured');
    }

    // Step 5: Prepare Azure endpoint and SSML
    const baseEndpoint = `https://${azureSpeechRegion}.tts.speech.microsoft.com`;
    const ttsEndpoint = `${baseEndpoint}/cognitiveservices/v1`;
    
    console.log('TTS endpoint:', ttsEndpoint);

    const voiceName = `en-US-${voice}Neural`;
    console.log('Using voice:', voiceName);

    // Step 6: Construct minimal valid SSML
    const ssml = `
<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
  <voice name='${voiceName}'>
    <prosody rate="0%">${text}</prosody>
  </voice>
</speak>`.trim();
    
    console.log('SSML payload:', ssml);

    // Step 7: Prepare headers with detailed logging
    const headers = {
      'Ocp-Apim-Subscription-Key': azureSpeechKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'LovableAI'
    };

    console.log('Request headers:', {
      ...headers,
      'Ocp-Apim-Subscription-Key': '[REDACTED]'
    });

    // Step 8: Make TTS request with enhanced error handling
    console.log('Making request to Azure TTS...');
    const response = await fetch(ttsEndpoint, {
      method: 'POST',
      headers,
      body: ssml
    });

    console.log('Azure TTS response status:', response.status);
    console.log('Azure TTS response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure TTS error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText,
        endpoint: ttsEndpoint,
        ssml: ssml
      });
      throw new Error(`Azure TTS Error: ${response.status} - ${errorText}`);
    }

    // Step 9: Process successful response
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