import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Azure Voice Test Function started');

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    console.log('Checking Azure Speech credentials:', {
      hasSpeechKey: !!speechKey,
      hasSpeechEndpoint: !!speechEndpoint
    });

    if (!speechKey || !speechEndpoint) {
      console.error('Missing Azure Speech credentials');
      throw new Error('Azure Speech credentials not configured');
    }

    // Test text for speech synthesis
    const testText = "Hello, this is a test of the Azure Speech Service.";
    
    console.log('Attempting to connect to Azure Speech Services...');
    
    // Construct SSML for the test
    const ssml = `
      <speak version='1.0' xml:lang='en-US'>
        <voice name='en-US-JennyNeural'>
          ${testText}
        </voice>
      </speak>`;

    console.log('Sending request to Azure Speech Services');

    const response = await fetch(`${speechEndpoint}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LovableAI'
      },
      body: ssml
    });

    console.log('Received response from Azure:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Speech Service Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Azure Speech Service Error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('Successfully generated audio, size:', audioBuffer.byteLength);

    // Convert to base64 for response
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log('Test completed successfully');

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'Azure Speech Services connection test successful',
        audioContent: base64Audio
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Test failed:', error);
    
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});