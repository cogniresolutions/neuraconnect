// Azure Neural TTS voices mapped by language
export const VOICE_MAPPINGS = {
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
} as const;

export type SupportedLanguage = keyof typeof VOICE_MAPPINGS;

// Localized test messages for each language
export const LOCALIZED_MESSAGES: Record<SupportedLanguage, string> = {
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