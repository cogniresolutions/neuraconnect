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

// Azure Neural TTS voices mapping
export const VOICE_MAPPINGS: Record<SupportedLanguage, { male: string[]; female: string[] }> = {
  'en-US': {
    male: ['en-US-GuyNeural', 'en-US-DavisNeural', 'en-US-TonyNeural'],
    female: ['en-US-JennyNeural', 'en-US-AriaNeural', 'en-US-NancyNeural']
  },
  'en-GB': {
    male: ['en-GB-RyanNeural'],
    female: ['en-GB-SoniaNeural', 'en-GB-LibbyNeural']
  },
  'es-ES': {
    male: ['es-ES-AlvaroNeural'],
    female: ['es-ES-ElviraNeural']
  },
  'fr-FR': {
    male: ['fr-FR-HenriNeural'],
    female: ['fr-FR-DeniseNeural']
  },
  'de-DE': {
    male: ['de-DE-ConradNeural'],
    female: ['de-DE-KatjaNeural']
  },
  'it-IT': {
    male: ['it-IT-DiegoNeural'],
    female: ['it-IT-ElsaNeural']
  },
  'ja-JP': {
    male: ['ja-JP-KeitaNeural'],
    female: ['ja-JP-NanamiNeural']
  },
  'ko-KR': {
    male: ['ko-KR-InJoonNeural'],
    female: ['ko-KR-SunHiNeural']
  },
  'zh-CN': {
    male: ['zh-CN-YunxiNeural'],
    female: ['zh-CN-XiaoxiaoNeural']
  }
};

export const LOCALIZED_MESSAGES: Record<SupportedLanguage, string> = {
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