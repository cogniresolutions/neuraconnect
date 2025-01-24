export type SupportedLanguage = 
  | 'en-US' 
  | 'en-GB'
  | 'es-ES'
  | 'fr-FR'
  | 'de-DE'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'zh-CN';

export type VoiceGender = 'Male' | 'Female';

export interface AzureVoice {
  name: string;
  displayName: string;
  gender: VoiceGender;
  locale: string;
}

// Azure Neural TTS voices mapping as per official documentation
export const AZURE_VOICES: Record<SupportedLanguage, AzureVoice[]> = {
  'en-US': [
    { name: 'en-US-JennyNeural', displayName: 'Jenny', gender: 'Female', locale: 'en-US' },
    { name: 'en-US-GuyNeural', displayName: 'Guy', gender: 'Male', locale: 'en-US' },
    { name: 'en-US-AriaNeural', displayName: 'Aria', gender: 'Female', locale: 'en-US' },
    { name: 'en-US-DavisNeural', displayName: 'Davis', gender: 'Male', locale: 'en-US' }
  ],
  'en-GB': [
    { name: 'en-GB-SoniaNeural', displayName: 'Sonia', gender: 'Female', locale: 'en-GB' },
    { name: 'en-GB-RyanNeural', displayName: 'Ryan', gender: 'Male', locale: 'en-GB' }
  ],
  'es-ES': [
    { name: 'es-ES-ElviraNeural', displayName: 'Elvira', gender: 'Female', locale: 'es-ES' },
    { name: 'es-ES-AlvaroNeural', displayName: 'Alvaro', gender: 'Male', locale: 'es-ES' }
  ],
  'fr-FR': [
    { name: 'fr-FR-DeniseNeural', displayName: 'Denise', gender: 'Female', locale: 'fr-FR' },
    { name: 'fr-FR-HenriNeural', displayName: 'Henri', gender: 'Male', locale: 'fr-FR' }
  ],
  'de-DE': [
    { name: 'de-DE-KatjaNeural', displayName: 'Katja', gender: 'Female', locale: 'de-DE' },
    { name: 'de-DE-ConradNeural', displayName: 'Conrad', gender: 'Male', locale: 'de-DE' }
  ],
  'it-IT': [
    { name: 'it-IT-ElsaNeural', displayName: 'Elsa', gender: 'Female', locale: 'it-IT' },
    { name: 'it-IT-DiegoNeural', displayName: 'Diego', gender: 'Male', locale: 'it-IT' }
  ],
  'ja-JP': [
    { name: 'ja-JP-NanamiNeural', displayName: 'Nanami', gender: 'Female', locale: 'ja-JP' },
    { name: 'ja-JP-KeitaNeural', displayName: 'Keita', gender: 'Male', locale: 'ja-JP' }
  ],
  'ko-KR': [
    { name: 'ko-KR-SunHiNeural', displayName: 'SunHi', gender: 'Female', locale: 'ko-KR' },
    { name: 'ko-KR-InJoonNeural', displayName: 'InJoon', gender: 'Male', locale: 'ko-KR' }
  ],
  'zh-CN': [
    { name: 'zh-CN-XiaoxiaoNeural', displayName: 'Xiaoxiao', gender: 'Female', locale: 'zh-CN' },
    { name: 'zh-CN-YunxiNeural', displayName: 'Yunxi', gender: 'Male', locale: 'zh-CN' }
  ]
};

export const LOCALIZED_TEST_MESSAGES: Record<SupportedLanguage, string> = {
  'en-US': "Hello! I'm your AI assistant. How can I help you today?",
  'en-GB': "Hello! I'm your AI assistant. How may I help you today?",
  'es-ES': "¡Hola! Soy tu asistente de IA. ¿Cómo puedo ayudarte hoy?",
  'fr-FR': "Bonjour! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui?",
  'de-DE': "Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?",
  'it-IT': "Ciao! Sono il tuo assistente IA. Come posso aiutarti oggi?",
  'ja-JP': "こんにちは！AIアシスタントです。今日はどのようにお手伝いできますか？",
  'ko-KR': "안녕하세요! AI 어시스턴트입니다. 오늘 어떻게 도와드릴까요?",
  'zh-CN': "你好！我是你的AI助手。今天我能帮你什么？"
};