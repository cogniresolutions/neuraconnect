import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice } = await req.json()
    console.log('Received request:', { text, voice })
    
    if (!text) {
      throw new Error('Text is required')
    }

    const endpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
    const subscriptionKey = Deno.env.get('AZURE_COGNITIVE_KEY')
    
    if (!endpoint || !subscriptionKey) {
      console.error('Azure credentials not found:', { endpoint: !!endpoint, key: !!subscriptionKey })
      throw new Error('Azure credentials not configured')
    }

    // Construct SSML with proper voice name format
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="en-US-${voice}">
          ${text}
        </voice>
      </speak>
    `

    console.log('Making request to Azure with endpoint:', endpoint)
    console.log('SSML payload:', ssml)

    const response = await fetch(`${endpoint}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LovableAI'
      },
      body: ssml
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure TTS Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Azure TTS Error: ${response.status} - ${errorText}`)
    }

    console.log('Successfully received audio response')

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    console.log('Successfully converted audio to base64')

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Text-to-speech error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})