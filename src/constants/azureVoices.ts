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

export type VoiceGender = 'male' | 'female';

interface AzureVoice {
  name: string;
  displayName: string;
  gender: VoiceGender;
  locale: string;
}

export const LOCALIZED_TEST_MESSAGES: Record<SupportedLanguage, string> = {
  'en-US': 'Hello! This is a test of the Azure Speech Service. How do I sound?',
  'en-GB': 'Hello! This is a test of the Azure Speech Service. How do I sound?',
  'es-ES': '¡Hola! Esta es una prueba del Servicio de voz de Azure. ¿Cómo sueno?',
  'fr-FR': 'Bonjour! Ceci est un test du service Azure Speech. Comment est-ce que je sonne?',
  'de-DE': 'Hallo! Dies ist ein Test des Azure Speech Service. Wie klinge ich?',
  'it-IT': 'Ciao! Questo è un test del servizio Azure Speech. Come suono?',
  'ja-JP': 'こんにちは！これはAzure Speech Serviceのテストです。声の調子はどうですか？',
  'ko-KR': '안녕하세요! Azure Speech Service 테스트입니다. 제 목소리는 어떠신가요?',
  'zh-CN': '你好！这是Azure语音服务的测试。我的声音怎么样？'
};

export const AZURE_VOICES: Record<SupportedLanguage, AzureVoice[]> = {
  'en-US': [
    { name: 'en-US-JennyNeural', displayName: 'Jenny', gender: 'female', locale: 'English (US)' },
    { name: 'en-US-GuyNeural', displayName: 'Guy', gender: 'male', locale: 'English (US)' },
    { name: 'en-US-AriaNeural', displayName: 'Aria', gender: 'female', locale: 'English (US)' },
    { name: 'en-US-DavisNeural', displayName: 'Davis', gender: 'male', locale: 'English (US)' }
  ],
  'en-GB': [
    { name: 'en-GB-SoniaNeural', displayName: 'Sonia', gender: 'female', locale: 'English (UK)' },
    { name: 'en-GB-RyanNeural', displayName: 'Ryan', gender: 'male', locale: 'English (UK)' }
  ],
  'es-ES': [
    { name: 'es-ES-ElviraNeural', displayName: 'Elvira', gender: 'female', locale: 'Spanish' },
    { name: 'es-ES-AlvaroNeural', displayName: 'Alvaro', gender: 'male', locale: 'Spanish' }
  ],
  'fr-FR': [
    { name: 'fr-FR-DeniseNeural', displayName: 'Denise', gender: 'female', locale: 'French' },
    { name: 'fr-FR-HenriNeural', displayName: 'Henri', gender: 'male', locale: 'French' }
  ],
  'de-DE': [
    { name: 'de-DE-KatjaNeural', displayName: 'Katja', gender: 'female', locale: 'German' },
    { name: 'de-DE-ConradNeural', displayName: 'Conrad', gender: 'male', locale: 'German' }
  ],
  'it-IT': [
    { name: 'it-IT-ElsaNeural', displayName: 'Elsa', gender: 'female', locale: 'Italian' },
    { name: 'it-IT-DiegoNeural', displayName: 'Diego', gender: 'male', locale: 'Italian' }
  ],
  'ja-JP': [
    { name: 'ja-JP-NanamiNeural', displayName: 'Nanami', gender: 'female', locale: 'Japanese' },
    { name: 'ja-JP-KeitaNeural', displayName: 'Keita', gender: 'male', locale: 'Japanese' }
  ],
  'ko-KR': [
    { name: 'ko-KR-SunHiNeural', displayName: 'SunHi', gender: 'female', locale: 'Korean' },
    { name: 'ko-KR-InJoonNeural', displayName: 'InJoon', gender: 'male', locale: 'Korean' }
  ],
  'zh-CN': [
    { name: 'zh-CN-XiaoxiaoNeural', displayName: 'Xiaoxiao', gender: 'female', locale: 'Chinese' },
    { name: 'zh-CN-YunxiNeural', displayName: 'Yunxi', gender: 'male', locale: 'Chinese' }
  ]
};

export const getVoicesForLanguage = (language: SupportedLanguage, gender?: VoiceGender): AzureVoice[] => {
  const voices = AZURE_VOICES[language] || AZURE_VOICES['en-US'];
  return gender ? voices.filter(voice => voice.gender === gender) : voices;
};

export const getDefaultVoice = (language: SupportedLanguage, gender: VoiceGender): string => {
  const voices = getVoicesForLanguage(language, gender);
  return voices[0]?.name || 'en-US-JennyNeural';
};