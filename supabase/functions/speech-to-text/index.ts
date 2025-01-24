import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioData } = await req.json()
    
    if (!audioData) {
      throw new Error('No audio data provided')
    }

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))

    // Get Azure credentials from environment
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY')
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')

    if (!speechKey || !speechEndpoint) {
      throw new Error('Azure Speech Services credentials not configured')
    }

    // Create speech recognition request
    const response = await fetch(
      `${speechEndpoint}/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'audio/wav',
        },
        body: binaryAudio,
      }
    )

    if (!response.ok) {
      throw new Error(`Azure Speech API error: ${await response.text()}`)
    }

    const result = await response.json()
    console.log('Speech recognition result:', result)

    return new Response(
      JSON.stringify({ text: result.DisplayText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Speech-to-text error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})