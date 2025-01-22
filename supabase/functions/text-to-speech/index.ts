import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice, language } = await req.json()
    
    if (!text) {
      throw new Error('Text is required')
    }

    const subscriptionKey = Deno.env.get('AZURE_COGNITIVE_KEY')
    const region = 'eastus' // Update this to match your Azure region
    
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`
    
    // Construct SSML
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language || 'en-US'}">
        <voice name="${voice || 'en-US-JennyNeural'}">
          ${text}
        </voice>
      </speak>
    `

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'YourAppName'
      },
      body: ssml
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Azure TTS Error:', error)
      throw new Error('Failed to generate speech')
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Text-to-speech error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})