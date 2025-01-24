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
    male: ['Guy', 'Davis', 'Tony'],
    female: ['Jenny', 'Aria', 'Nancy']
  },
  'en-GB': {
    male: ['Ryan'],
    female: ['Sonia', 'Libby']
  },
  'es-ES': {
    male: ['Alvaro'],
    female: ['Elvira']
  },
  'fr-FR': {
    male: ['Henri'],
    female: ['Denise']
  },
  'de-DE': {
    male: ['Conrad'],
    female: ['Katja']
  },
  'it-IT': {
    male: ['Diego'],
    female: ['Elsa']
  },
  'ja-JP': {
    male: ['Keita'],
    female: ['Nanami']
  },
  'ko-KR': {
    male: ['InJoon'],
    female: ['SunHi']
  },
  'zh-CN': {
    male: ['Yunxi'],
    female: ['Xiaoxiao']
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