import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Azure voice test...');
    
    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    console.log('Checking Azure Speech credentials:', {
      hasKey: !!azureSpeechKey,
      hasEndpoint: !!azureSpeechEndpoint,
      endpoint: azureSpeechEndpoint // Log the endpoint for verification
    });

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      console.error('Azure Speech credentials not configured');
      throw new Error('Azure Speech credentials not configured');
    }

    // Test text-to-speech with a simple SSML payload
    const ssml = `
      <speak version='1.0' xml:lang='en-US'>
        <voice name='en-US-JennyNeural'>
          This is a test of the Azure Speech Services connection.
        </voice>
      </speak>
    `;

    console.log('Testing Azure Speech Services with endpoint:', azureSpeechEndpoint);
    
    const response = await fetch(`${azureSpeechEndpoint}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LovableAI'
      },
      body: ssml
    });

    console.log('Azure Speech Services response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Speech Services error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Failed to connect to Azure Speech Services: ${response.statusText}\n${errorText}`);
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Successfully generated audio, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Azure Speech Services connection successful',
        audioContent: base64Audio 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in azure-voice-test function:', error);
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