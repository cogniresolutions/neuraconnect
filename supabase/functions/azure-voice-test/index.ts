import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Azure Voice Test Function loaded');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Azure Speech Services test...');
    
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

    // Parse the request body
    const requestData = await req.json();
    const { text, voice } = requestData;
    
    if (!text || !voice) {
      throw new Error('Missing required parameters: text or voice');
    }

    console.log('Request data:', { text, voice });

    // Extract region from endpoint
    const baseEndpoint = azureSpeechEndpoint.endsWith('/') 
      ? azureSpeechEndpoint.slice(0, -1) 
      : azureSpeechEndpoint;
    
    const region = baseEndpoint.match(/https:\/\/([^.]+)\./)?.[1] || 'eastus';
    console.log('Region extracted:', region);

    // Test voices endpoint first
    console.log('Testing voices endpoint...');
    const voicesEndpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
    const voicesResponse = await fetch(voicesEndpoint, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey
      }
    });

    if (!voicesResponse.ok) {
      const voicesError = await voicesResponse.text();
      console.error('Voices endpoint error:', voicesError);
      throw new Error(`Voice service not accessible: ${voicesResponse.status} - ${voicesError}`);
    }

    const voices = await voicesResponse.json();
    console.log('Available voices count:', voices.length);

    // Verify the requested voice exists
    const voiceExists = voices.some((v: any) => v.ShortName === voice);
    if (!voiceExists) {
      throw new Error(`Voice '${voice}' not found in available voices`);
    }

    // Prepare SSML
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='${voice}'>
          ${escapedText}
        </voice>
      </speak>
    `.trim();

    console.log('SSML Payload:', ssml);

    // Perform TTS synthesis
    const ttsEndpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    console.log('Using TTS endpoint:', ttsEndpoint);

    const ttsResponse = await fetch(ttsEndpoint, {
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
        error: errorText,
        endpoint: ttsEndpoint,
        voice,
        ssml
      });
      throw new Error(`Text-to-speech synthesis failed: ${ttsResponse.status} - ${errorText}`);
    }

    // Process successful response
    console.log('Successfully received audio response');
    const arrayBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Successfully converted audio to base64, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: base64Audio,
        metadata: {
          voice,
          endpoint: ttsEndpoint,
          region: region,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
          name: error.name,
          stack: error.stack
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});