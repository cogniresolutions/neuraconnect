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
    const { text, voice } = await req.json()
    console.log('Received request:', { text, voice })
    
    if (!text) {
      throw new Error('Text is required')
    }

    // Get Azure credentials and ensure TTS endpoint
    const endpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')?.replace('stt.speech', 'tts.speech')?.replace(/\/$/, '')
    const subscriptionKey = Deno.env.get('AZURE_SPEECH_KEY')
    
    console.log('Azure credentials check:', {
      hasEndpoint: !!endpoint,
      hasKey: !!subscriptionKey,
      endpoint: endpoint
    })

    if (!endpoint || !subscriptionKey) {
      throw new Error('Azure credentials not configured')
    }

    // Format voice name correctly for Azure
    const voiceName = `en-US-${voice}Neural`
    console.log('Using voice:', voiceName)

    // Simple HTML entities escaping
    const escapeXml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    // Construct SSML with proper XML namespace
    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='${voiceName}'>
          <prosody rate="0%">
            ${escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `.trim();
    
    console.log('SSML payload:', ssml)

    // Use the correct endpoint format for text-to-speech
    const ttsUrl = `${endpoint}/cognitiveservices/v1`
    console.log('TTS URL:', ttsUrl)

    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'LovableAI'
      },
      body: ssml
    })

    console.log('TTS response status:', response.status)
    console.log('TTS response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('TTS error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: ttsUrl,
        ssml: ssml,
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
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})