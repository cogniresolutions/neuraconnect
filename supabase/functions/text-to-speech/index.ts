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

    const endpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')
    const subscriptionKey = Deno.env.get('AZURE_SPEECH_KEY')
    
    console.log('Azure credentials check:', {
      hasEndpoint: !!endpoint,
      hasKey: !!subscriptionKey
    })

    if (!endpoint || !subscriptionKey) {
      console.error('Azure credentials not found:', { endpoint: !!endpoint, key: !!subscriptionKey })
      throw new Error('Azure credentials not configured')
    }

    // Extract the region from the endpoint URL and construct the TTS endpoint
    const region = endpoint.match(/\/\/([^.]+)\./)?.[1] || 'unknown'
    const ttsEndpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`
    
    console.log('Using TTS endpoint:', ttsEndpoint)
    console.log('Using voice:', `en-US-${voice}Neural`)

    // Construct SSML
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="en-US-${voice}Neural">${text}</voice>
    </speak>`

    console.log('Making request to Azure')
    console.log('SSML payload:', ssml)

    const response = await fetch(ttsEndpoint, {
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
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        endpoint: ttsEndpoint,
        headers: Object.fromEntries(response.headers.entries())
      }
      console.error('Azure TTS Error Response:', JSON.stringify(errorDetails, null, 2))
      throw new Error(`Azure TTS Error: ${response.status} - ${errorText}`)
    }

    console.log('Successfully received audio response')

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    console.log('Successfully converted audio to base64, length:', base64Audio.length)

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
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})