import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage } = await req.json();
    
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

    const data = await response.json();
    const translatedText = data[0]?.translations[0]?.text;

    console.log('Translation successful:', { originalText: text, translatedText });

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});