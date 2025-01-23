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
    const response = await fetch(`${endpoint}vision/v3.2/analyze`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Field_sparrow_in_CP.jpg/1200px-Field_sparrow_in_CP.jpg'
      })
    })

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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
      }
    })

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
    const response = await fetch(`${endpoint}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Field_sparrow_in_CP.jpg/1200px-Field_sparrow_in_CP.jpg'
      })
    })

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