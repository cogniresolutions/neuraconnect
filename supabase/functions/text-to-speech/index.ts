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

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    console.log('OpenAI credentials check:', {
      hasKey: !!openaiKey
    })

    if (!openaiKey) {
      console.error('OpenAI API key not found')
      throw new Error('OpenAI API key not configured')
    }

    console.log('Making request to OpenAI TTS API...')

    // Make request to OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice.toLowerCase(),
        response_format: 'mp3'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI TTS Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`OpenAI TTS Error: ${response.status} - ${errorText}`)
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