import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const AZURE_COGNITIVE_ENDPOINT = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
    if (!AZURE_COGNITIVE_ENDPOINT) {
      throw new Error('AZURE_COGNITIVE_ENDPOINT is not set')
    }

    const { image } = await req.json()
    if (!image) {
      throw new Error('No image data provided')
    }

    // Call Azure Cognitive Services Computer Vision API
    const response = await fetch(`${AZURE_COGNITIVE_ENDPOINT}/vision/v3.2/analyze?visualFeatures=Objects,Tags,Description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': Deno.env.get('AZURE_COGNITIVE_KEY') || '',
      },
      body: JSON.stringify({
        url: image
      })
    })

    const data = await response.json()
    console.log('Environment analysis response:', data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in analyze-environment function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})