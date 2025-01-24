import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map of language codes to their corresponding voice models based on Azure's documentation
const languageVoiceMap: Record<string, { male: string[], female: string[] }> = {
  'en-US': {
    male: ['GuyNeural', 'DavisNeural', 'TonyNeural'],
    female: ['JennyNeural', 'AriaNeural', 'NancyNeural']
  },
  'en-GB': {
    male: ['RyanNeural', 'AlfieNeural', 'ElliotNeural', 'EthanNeural', 'NoahNeural', 'OliverNeural', 'ThomasNeural'],
    female: ['SoniaNeural', 'LibbyNeural', 'AbbiNeural', 'BellaNeural', 'HollieNeural', 'MaisieNeural']
  },
  'es-ES': {
    male: ['AlvaroNeural', 'ArnauNeural', 'DarioNeural', 'EliasNeural', 'NilNeural', 'SaulNeural', 'TeoNeural'],
    female: ['ElviraNeural', 'AbrilNeural', 'EstrellaNeural', 'IreneNeural', 'LaiaNeural', 'LiaNeural', 'TrianaNeural', 'VeronicaNeural']
  },
  'fr-FR': {
    male: ['HenriNeural', 'AlainNeural', 'ClaudeNeural', 'JeromeNeural', 'MauriceNeural', 'YvesNeural'],
    female: ['DeniseNeural', 'BrigitteNeural', 'CelesteNeural', 'CoralieNeural', 'EloiseNeural', 'JacquelineNeural', 'JosephineNeural', 'YvetteNeural']
  },
  'de-DE': {
    male: ['ConradNeural', 'BerndNeural', 'ChristophNeural', 'KasperNeural', 'KillianNeural', 'KlausNeural', 'RalfNeural'],
    female: ['KatjaNeural', 'AmalaNeural', 'ElkeNeural', 'GiselaNeural', 'KlarissaNeural', 'LouisaNeural', 'MajaNeural', 'TanjaNeural']
  },
  'it-IT': {
    male: ['DiegoNeural', 'BenignoNeural', 'CalimeroNeural', 'CataldoNeural', 'GianniNeural', 'LisandroNeural', 'RinaldoNeural'],
    female: ['ElsaNeural', 'IsabellaNeural', 'FabiolaNeural', 'FiammaNeural', 'PalmiraNeural', 'PierinaNeural']
  },
  'ja-JP': {
    male: ['KeitaNeural', 'DaichiNeural', 'NaokiNeural', 'AkihiroNeural'],
    female: ['NanamiNeural', 'AoiNeural', 'MayuNeural', 'ShioriNeural']
  },
  'ko-KR': {
    male: ['InJoonNeural', 'BongJinNeural', 'GookMinNeural'],
    female: ['SunHiNeural', 'JiMinNeural', 'SeoHyeonNeural', 'SoonBokNeural', 'YuJinNeural']
  },
  'zh-CN': {
    male: ['YunxiNeural', 'YunjianNeural', 'YunyangNeural', 'YunfengNeural', 'YunhaoNeural', 'YunxiaNeural', 'YunzeNeural'],
    female: ['XiaoxiaoNeural', 'XiaoyiNeural', 'XiaochenNeural', 'XiaohanNeural', 'XiaomoNeural', 'XiaoqiuNeural', 'XiaoruiNeural', 'XiaoshuangNeural', 'XiaoxuanNeural', 'XiaoyanNeural', 'XiaoyouNeural']
  }
};

// Localized test messages for each language
const localizedMessages: Record<string, string> = {
  'en-US': "Hello! I'm your AI assistant. How can I help you today?",
  'en-GB': "Hello! I'm your AI assistant. How can I help you today?",
  'es-ES': "¡Hola! Soy tu asistente de IA. ¿Cómo puedo ayudarte hoy?",
  'fr-FR': "Bonjour! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui?",
  'de-DE': "Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
  'it-IT': "Ciao! Sono il tuo assistente IA. Come posso aiutarti oggi?",
  'ja-JP': "こんにちは！AIアシスタントです。今日はどのようにお手伝いできますか？",
  'ko-KR': "안녕하세요! AI 어시스턴트입니다. 오늘 어떻게 도와드릴까요?",
  'zh-CN': "你好！我是你的AI助手。今天我能帮你什么？"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice, language = 'en-US' } = await req.json();
    console.log('Request data:', { text, voice, language });

    // Verify language is supported
    if (!languageVoiceMap[language]) {
      console.error('Unsupported language:', language);
      throw new Error(`Language ${language} is not supported`);
    }

    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureSpeechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    if (!azureSpeechKey || !azureSpeechEndpoint) {
      throw new Error('Azure Speech credentials not configured');
    }

    // Extract region from endpoint
    const region = azureSpeechEndpoint.match(/\/\/([^.]+)\./)?.[1] || 'eastus';
    console.log('Using region:', region);

    // Determine if the voice is male or female based on the voice name
    const voiceName = voice.replace(/[^a-zA-Z]/g, '');
    let selectedVoiceName: string;

    // Check if the voice exists in either male or female arrays for the selected language
    if (languageVoiceMap[language].male.includes(voiceName + 'Neural')) {
      selectedVoiceName = `${language}-${voiceName}Neural`;
    } else if (languageVoiceMap[language].female.includes(voiceName + 'Neural')) {
      selectedVoiceName = `${language}-${voiceName}Neural`;
    } else {
      // Fallback to first voice of the language if the requested voice is not found
      selectedVoiceName = `${language}-${languageVoiceMap[language].female[0]}`;
      console.log('Voice not found for language, using fallback voice:', selectedVoiceName);
    }

    console.log('Selected voice name:', selectedVoiceName);

    // Get localized message based on language
    const messageToSpeak = text || localizedMessages[language] || localizedMessages['en-US'];
    console.log('Message to speak:', messageToSpeak);

    // Check available voices from Azure
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

    // Prepare SSML with proper escaping and language setting
    const escapedText = messageToSpeak
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${language}'>
        <voice name='${selectedVoiceName}'>
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
          voice: selectedVoiceName,
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