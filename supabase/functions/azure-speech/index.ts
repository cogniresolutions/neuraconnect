import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audio, mode, text, voice } = await req.json()
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY')
    const speechRegion = Deno.env.get('AZURE_SPEECH_REGION')

    if (!speechKey || !speechRegion) {
      throw new Error('Azure Speech credentials not configured')
    }

    if (mode === 'stt') {
      // Speech-to-text
      const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'audio/wav'
        },
        body: audio
      })

      if (!response.ok) {
        throw new Error(`Azure STT error: ${await response.text()}`)
      }

      const result = await response.json()
      return new Response(JSON.stringify({ text: result.DisplayText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else if (mode === 'tts') {
      // Text-to-speech
      const endpoint = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`
      const ssml = `
        <speak version='1.0' xml:lang='en-US'>
          <voice name='${voice || 'en-US-JennyNeural'}'>
            ${text}
          </voice>
        </speak>
      `

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      })

      if (!response.ok) {
        throw new Error(`Azure TTS error: ${await response.text()}`)
      }

      const audioData = await response.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)))

      return new Response(JSON.stringify({ audio: base64Audio }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid mode specified')
  } catch (error) {
    console.error('Azure Speech error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})