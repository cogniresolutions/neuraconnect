import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice } = await req.json()
    console.log('Received request:', { text, voice })
    
    if (!text) {
      throw new Error('Text is required')
    }

    const endpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')?.replace(/\/$/, '') // Remove trailing slash if present
    const subscriptionKey = Deno.env.get('AZURE_SPEECH_KEY')
    
    console.log('Azure credentials check:', {
      hasEndpoint: !!endpoint,
      hasKey: !!subscriptionKey,
      endpoint: endpoint // Log the endpoint for debugging
    })

    if (!endpoint || !subscriptionKey) {
      console.error('Azure credentials not found')
      throw new Error('Azure credentials not configured')
    }

    // Format voice name correctly for Azure
    const voiceName = `en-US-${voice}Neural`
    console.log('Using voice:', voiceName)

    // Construct SSML with proper XML escaping
    const escapedText = text.replace(/[&<>"']/g, (char) => {
      const entities: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
      }
      return entities[char]
    })

    const ssml = `<speak version='1.0' xml:lang='en-US'>
      <voice name='${voiceName}'>
        ${escapedText}
      </voice>
    </speak>`

    console.log('SSML payload:', ssml)

    // Make request to Azure TTS API with the correct endpoint
    const ttsEndpoint = `${endpoint}/cognitiveservices/v1/synthesize/text-to-speech`
    console.log('Making request to endpoint:', ttsEndpoint)

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
      console.error('Azure TTS Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        endpoint: ttsEndpoint,
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`Azure TTS Error: ${response.status} - ${errorText}`)
    }

    console.log('Successfully received audio response')

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    console.log('Successfully converted audio to base64, length:', base64Audio.length)

    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: base64Audio 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  } catch (error) {
    console.error('Text-to-speech error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
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