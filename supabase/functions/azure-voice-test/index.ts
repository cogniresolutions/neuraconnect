import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Azure Voice Test Function loaded');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Get and validate Azure credentials
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

    // Step 2: Parse and validate request
    const { text, voice } = await req.json();
    console.log('Request data:', { text, voice });

    if (!text || !voice) {
      throw new Error('Missing required fields: text and voice are required');
    }

    // Extract region from endpoint (e.g., "eastus" from "https://eastus.tts.speech.microsoft.com")
    const region = azureSpeechEndpoint.match(/\/\/([^.]+)\./)?.[1] || 'eastus';
    console.log('Using region:', region);

    // Step 3: Check available voices using Speech Services endpoint
    console.log('Fetching available voices...');
    const voicesUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
    console.log('Using voices list URL:', voicesUrl);
    
    const voicesResponse = await fetch(voicesUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureSpeechKey,
      },
    });

    if (!voicesResponse.ok) {
      const errorText = await voicesResponse.text();
      console.error('Error fetching voices:', {
        status: voicesResponse.status,
        statusText: voicesResponse.statusText,
        error: errorText,
        endpoint: voicesUrl,
        region: region
      });
      throw new Error(`Failed to fetch voices: ${voicesResponse.status} - ${errorText}`);
    }

    const voices = await voicesResponse.json();
    console.log('Available voices count:', voices.length);

    // The voice parameter should already be in format "en-US-JennyNeural"
    console.log('Checking for voice:', voice);
    const voiceExists = voices.some((v: any) => v.ShortName === voice);
    if (!voiceExists) {
      console.error('Available voices:', voices.map((v: any) => v.ShortName));
      throw new Error(`Voice '${voice}' not found in available voices`);
    }

    // Prepare SSML with proper escaping
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
    `;

    // Step 4: Make request to Azure Speech Services TTS endpoint
    console.log('Making request to Azure TTS...');
    const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    console.log('Using TTS URL:', ttsUrl);
    
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

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('TTS error:', {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        error: errorText,
        endpoint: ttsUrl,
        voice: voice,
        ssml
      });
      throw new Error(`Text-to-speech synthesis failed: ${ttsResponse.status} - ${errorText}`);
    }

    // Step 5: Process successful response
    console.log('Successfully received audio response');
    const arrayBuffer = await ttsResponse.arrayBuffer();
    
    // Convert ArrayBuffer to Base64
    const bytes = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
    const base64Audio = btoa(binaryString);

    console.log('Successfully converted audio to base64, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: base64Audio,
        metadata: {
          voice: voice,
          endpoint: ttsUrl,
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
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});