// Azure Neural TTS voices that are known to work well
export const VALID_VOICES = [
  "Jenny",  // Female
  "Guy",    // Male
  "Aria",   // Female
  "Davis",  // Male
  "Jane",   // Female
  "Jason",  // Male
  "Nancy",  // Female
  "Tony",   // Male
  "Sara",   // Female
  "Brandon" // Male
] as const;

export type ValidVoice = typeof VALID_VOICES[number];