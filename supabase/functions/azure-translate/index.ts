import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface TranslationRequest {
  text: string;
  targetLanguage: string;
}

interface AzureTranslationResponse {
  translations: {
    text: string;
    to: string;
  }[];
  detectedLanguage?: {
    language: string;
    score: number;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, targetLanguage } = await req.json() as TranslationRequest;

    if (!text || !targetLanguage) {
      throw new Error('Missing required parameters: text and targetLanguage');
    }

    const key = Deno.env.get('AZURE_TRANSLATOR_KEY');
    const location = Deno.env.get('AZURE_TRANSLATOR_LOCATION');

    if (!key || !location) {
      throw new Error('Azure Translator credentials not configured');
    }

    // Use the Text Translation endpoint
    const endpoint = "https://api.cognitive.microsofttranslator.com";
    const url = `${endpoint}/translate?api-version=3.0&to=${targetLanguage}`;

    console.log('Sending translation request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': location,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text }]),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.statusText);
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json() as AzureTranslationResponse[];
    const translatedText = data[0]?.translations[0]?.text;
    const detectedLanguage = data[0]?.detectedLanguage;

    if (!translatedText) {
      throw new Error('No translation received from Azure');
    }

    console.log('Translation successful:', { 
      originalText: text, 
      translatedText,
      detectedLanguage 
    });

    return new Response(
      JSON.stringify({ 
        translatedText,
        detectedLanguage
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in translation service:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Translation service error' 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});