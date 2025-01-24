import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Azure Voice Test Function loaded');

// Map of language codes to their corresponding voice models
const languageVoiceMap: Record<string, string[]> = {
  'en-US': ['Jenny', 'Guy', 'Aria', 'Davis'],
  'ja-JP': ['Nanami', 'Keita'],
  'es-ES': ['Elvira', 'Alvaro'],
  'fr-FR': ['Denise', 'Henri'],
  'de-DE': ['Katja', 'Conrad'],
  'it-IT': ['Elsa', 'Diego'],
  'ko-KR': ['Sun-Hi', 'In-Ho'],
  'zh-CN': ['Xiaoxiao', 'Yunyang']
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice, language = 'en-US' } = await req.json();
    console.log('Request data:', { text, voice, language });

    if (!text || !voice) {
      throw new Error('Missing required fields: text and voice are required');
    }

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

    // Extract region from endpoint
    const region = azureSpeechEndpoint.match(/\/\/([^.]+)\./)?.[1] || 'eastus';
    console.log('Using region:', region);

    // Format the voice name according to Azure's naming convention
    // Example: "Jenny" becomes "en-US-JennyNeural" for US English
    const voiceName = `${language}-${voice}Neural`;
    console.log('Using voice:', voiceName);

    // Check available voices
    const voicesUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
    console.log('Fetching available voices from:', voicesUrl);
    
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
        error: errorText
      });
      throw new Error(`Failed to fetch voices: ${voicesResponse.status} - ${errorText}`);
    }

    const voices = await voicesResponse.json();
    console.log('Available voices for language:', voices.filter((v: any) => v.Locale === language).map((v: any) => v.ShortName));

    const voiceExists = voices.some((v: any) => v.ShortName === voiceName);
    if (!voiceExists) {
      console.error('Voice not found:', voiceName);
      console.log('Available voices:', voices.map((v: any) => v.ShortName));
      throw new Error(`Voice '${voiceName}' not found in available voices for language ${language}`);
    }

    // Prepare SSML with proper escaping and language setting
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${language}'>
        <voice name='${voiceName}'>
          ${escapedText}
        </voice>
      </speak>
    `;

    console.log('Making request to Azure TTS with SSML:', ssml);
    const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
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
          voice: voiceName,
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