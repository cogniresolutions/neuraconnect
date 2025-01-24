import { supabase } from "@/integrations/supabase/client";

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('azure-translate', {
      body: { text, targetLanguage }
    });

    if (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }

    return data?.translatedText || text;
  } catch (error) {
    console.error('Translation service error:', error);
    return text; // Return original text if service fails
  }
}