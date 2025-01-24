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
    console.log('Starting Azure voice test...')
    const { voice = 'en-US-JennyNeural' } = await req.json()
    
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY')
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')

    if (!speechKey || !speechEndpoint) {
      console.error('Missing Azure Speech credentials')
      throw new Error('Azure Speech credentials not configured')
    }

    console.log('Using voice:', voice)
    console.log('Endpoint:', speechEndpoint)

    const ssml = `
      <speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis'>
        <voice name='${voice}'>
          This is a test of the Azure Speech Service.
        </voice>
      </speak>`

    console.log('Making request to Azure Speech Service...')
    const response = await fetch(`${speechEndpoint}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure Speech error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Speech synthesis failed: ${response.status} - ${errorText}`)
    }

    console.log('Successfully received audio response')
    const audioData = await response.arrayBuffer()
    
    return new Response(
      JSON.stringify({ 
        success: true,
        audioContent: btoa(String.fromCharCode(...new Uint8Array(audioData)))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Voice test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})