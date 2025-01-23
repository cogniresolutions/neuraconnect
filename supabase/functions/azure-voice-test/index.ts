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

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      console.error('Azure Speech credentials not configured');
      throw new Error('Azure Speech credentials not configured');
    }

    console.log('Azure Speech credentials found, testing connection...');

    // Test text-to-speech endpoint
    const response = await fetch(`${azureSpeechEndpoint}/cognitiveservices/voices/list`, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
      },
    });

    if (!response.ok) {
      console.error('Failed to connect to Azure Speech Services:', response.statusText);
      throw new Error(`Failed to connect to Azure Speech Services: ${response.statusText}`);
    }

    const voices = await response.json();
    console.log('Successfully retrieved voices list:', voices.length, 'voices available');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Azure Speech Services connection successful',
        voicesAvailable: voices.length
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
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});