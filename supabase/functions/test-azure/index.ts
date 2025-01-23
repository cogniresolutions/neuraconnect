import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function testAzureCognitive() {
  const key = Deno.env.get('AZURE_COGNITIVE_KEY')
  const endpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
  
  if (!key || !endpoint) {
    return { service: 'Cognitive Services', status: 'failed', error: 'Missing credentials' }
  }

  try {
    // Ensure endpoint ends with a slash before appending the path
    const baseUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`
    console.log('Testing Cognitive Services with URL:', `${baseUrl}vision/v3.2/analyze`)
    
    const response = await fetch(`${baseUrl}vision/v3.2/analyze?visualFeatures=Description`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
      })
    })

    console.log('Cognitive Services response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cognitive Services error:', errorText)
    }

    return {
      service: 'Cognitive Services',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status
    }
  } catch (error) {
    console.error('Cognitive Services test error:', error)
    return { service: 'Cognitive Services', status: 'failed', error: error.message }
  }
}

async function testAzureSpeech() {
  const key = Deno.env.get('AZURE_SPEECH_KEY')
  const endpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')
  
  if (!key || !endpoint) {
    return { service: 'Speech Services', status: 'failed', error: 'Missing credentials' }
  }

  try {
    // Use the TTS endpoint format
    const baseUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`
    console.log('Testing Speech Services with URL:', `${baseUrl}cognitiveservices/voices/list`)
    
    // Test TTS endpoint by getting available voices
    const response = await fetch(`${baseUrl}cognitiveservices/voices/list`, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
      }
    })

    console.log('Speech Services response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Speech Services error:', errorText)
    }

    return {
      service: 'Speech Services',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status
    }
  } catch (error) {
    console.error('Speech Services test error:', error)
    return { service: 'Speech Services', status: 'failed', error: error.message }
  }
}

async function testAzureVision() {
  const key = Deno.env.get('AZURE_VISION_KEY')
  const endpoint = Deno.env.get('AZURE_VISION_ENDPOINT')
  
  if (!key || !endpoint) {
    return { service: 'Vision Services', status: 'failed', error: 'Missing credentials' }
  }

  try {
    // Ensure endpoint ends with a slash before appending the path
    const baseUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`
    console.log('Testing Vision Services with URL:', `${baseUrl}computervision/imageanalysis:analyze`)
    
    const response = await fetch(`${baseUrl}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
      })
    })

    console.log('Vision Services response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vision Services error:', errorText)
    }

    return {
      service: 'Vision Services',
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status
    }
  } catch (error) {
    console.error('Vision Services test error:', error)
    return { service: 'Vision Services', status: 'failed', error: error.message }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Azure services test...')
    
    const results = await Promise.all([
      testAzureCognitive(),
      testAzureSpeech(),
      testAzureVision()
    ])

    console.log('Test results:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Test failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})