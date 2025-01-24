import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice, language = 'en-US' } = await req.json();
    console.log('Request data:', { text, voice, language });

    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      throw new Error('Azure Speech credentials not configured');
    }

    // Extract region from endpoint
    const region = azureSpeechEndpoint.match(/\/\/([^.]+)\./)?.[1] || 'eastus';
    console.log('Using region:', region);

    // Prepare SSML with proper escaping and language setting
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Format the voice name correctly for Azure TTS
    const formattedVoice = voice.endsWith('Neural') ? voice : `${voice}Neural`;
    console.log('Formatted voice name:', formattedVoice);

    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${language}'>
        <voice name='${formattedVoice}'>
          ${escapedText}
        </voice>
      </speak>
    `;

    console.log('Making request to Azure TTS with SSML:', ssml);
    // Use the full endpoint URL from the environment variable
    const ttsUrl = `${azureSpeechEndpoint}/cognitiveservices/v1`;
    console.log('TTS URL:', ttsUrl);
    
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
        error: errorText
      });
      throw new Error(`Text-to-speech synthesis failed: ${ttsResponse.status} - ${errorText}`);
    }

    console.log('Successfully received audio response');
    const arrayBuffer = await ttsResponse.arrayBuffer();
    
    const bytes = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
    const base64Audio = btoa(binaryString);

    console.log('Successfully converted audio to base64, length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: base64Audio,
        metadata: {
          voice: formattedVoice,
          language,
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