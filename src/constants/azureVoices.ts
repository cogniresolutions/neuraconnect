export type SupportedLanguage = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'ja-JP' | 'ko-KR' | 'zh-CN';
export type VoiceGender = 'Male' | 'Female';

interface AzureVoice {
  name: string;
  locale: string;
  gender: VoiceGender;
}

export const AZURE_VOICES: Record<SupportedLanguage, AzureVoice[]> = {
  'en-US': [
    { name: 'en-US-JennyNeural', locale: 'English (US)', gender: 'Female' },
    { name: 'en-US-GuyNeural', locale: 'English (US)', gender: 'Male' },
  ],
  'es-ES': [
    { name: 'es-ES-ElviraNeural', locale: 'Spanish (Spain)', gender: 'Female' },
    { name: 'es-ES-AlvaroNeural', locale: 'Spanish (Spain)', gender: 'Male' },
  ],
  'fr-FR': [
    { name: 'fr-FR-DeniseNeural', locale: 'French (France)', gender: 'Female' },
    { name: 'fr-FR-HenriNeural', locale: 'French (France)', gender: 'Male' },
  ],
  'de-DE': [
    { name: 'de-DE-KatjaNeural', locale: 'German', gender: 'Female' },
    { name: 'de-DE-ConradNeural', locale: 'German', gender: 'Male' },
  ],
  'it-IT': [
    { name: 'it-IT-ElsaNeural', locale: 'Italian', gender: 'Female' },
    { name: 'it-IT-DiegoNeural', locale: 'Italian', gender: 'Male' },
  ],
  'ja-JP': [
    { name: 'ja-JP-NanamiNeural', locale: 'Japanese', gender: 'Female' },
    { name: 'ja-JP-KeitaNeural', locale: 'Japanese', gender: 'Male' },
  ],
  'ko-KR': [
    { name: 'ko-KR-SunHiNeural', locale: 'Korean', gender: 'Female' },
    { name: 'ko-KR-InJoonNeural', locale: 'Korean', gender: 'Male' },
  ],
  'zh-CN': [
    { name: 'zh-CN-XiaoxiaoNeural', locale: 'Chinese (Mandarin)', gender: 'Female' },
    { name: 'zh-CN-YunxiNeural', locale: 'Chinese (Mandarin)', gender: 'Male' },
  ],
};

export const LOCALIZED_TEST_MESSAGES: Record<SupportedLanguage, string> = {
  'en-US': 'Hello! This is a test of the Azure Speech Services.',
  'es-ES': '¡Hola! Esta es una prueba de Azure Speech Services.',
  'fr-FR': 'Bonjour! Ceci est un test des services Azure Speech.',
  'de-DE': 'Hallo! Dies ist ein Test der Azure Speech Services.',
  'it-IT': 'Ciao! Questo è un test di Azure Speech Services.',
  'ja-JP': 'こんにちは！これはAzure Speech Servicesのテストです。',
  'ko-KR': '안녕하세요! Azure Speech Services 테스트입니다.',
  'zh-CN': '你好！这是Azure Speech Services的测试。',
};