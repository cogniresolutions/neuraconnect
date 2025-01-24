import { supabase } from "@/integrations/supabase/client";

interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: {
    language: string;
    score: number;
  };
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke<TranslationResponse>('azure-translate', {
      body: { text, targetLanguage }
    });

    if (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }

    if (!data?.translatedText) {
      throw new Error('No translation received');
    }

    return data.translatedText;
  } catch (error) {
    console.error('Translation service error:', error);
    // Return original text if translation fails
    return text;
  }
}