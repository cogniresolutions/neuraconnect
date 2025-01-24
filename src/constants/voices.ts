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

export const VOICE_MAPPINGS: Record<SupportedLanguage, { male: string[]; female: string[] }> = {
  'en-US': {
    male: ['GuyNeural', 'DavisNeural', 'TonyNeural'],
    female: ['JennyNeural', 'AriaNeural', 'NancyNeural']
  },
  'en-GB': {
    male: ['RyanNeural'],
    female: ['SoniaNeural', 'LibbyNeural']
  },
  'es-ES': {
    male: ['AlvaroNeural'],
    female: ['ElviraNeural']
  },
  'fr-FR': {
    male: ['HenriNeural'],
    female: ['DeniseNeural']
  },
  'de-DE': {
    male: ['ConradNeural'],
    female: ['KatjaNeural']
  },
  'it-IT': {
    male: ['DiegoNeural'],
    female: ['ElsaNeural']
  },
  'ja-JP': {
    male: ['KeitaNeural'],
    female: ['NanamiNeural']
  },
  'ko-KR': {
    male: ['InJoonNeural'],
    female: ['SunHiNeural']
  },
  'zh-CN': {
    male: ['YunxiNeural'],
    female: ['XiaoxiaoNeural']
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