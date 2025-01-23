import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const testCognitiveServices = async (endpoint: string, key: string) => {
  console.log('Starting Cognitive Services test...')
  if (!endpoint || !key) {
    console.error('Missing endpoint or key for Cognitive Services')
    throw new Error('Missing endpoint or key')
  }

  try {
    // Extract the region from the endpoint URL for consistent formatting
    const region = endpoint.match(/\/\/([^.]+)\./)?.[1] || 'eastus'
    const cognitiveEndpoint = `https://${region}.api.cognitive.microsoft.com/vision/v3.2/analyze?visualFeatures=Description`
    
    console.log('Testing Cognitive Services with URL:', cognitiveEndpoint)
    console.log('Key provided (length):', key.length)
    
    const response = await fetch(cognitiveEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': key
      },
      body: JSON.stringify({
        url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
      })
    })

    console.log('Cognitive Services Response Status:', response.status)
    const data = await response.json()
    console.log('Cognitive Services Response:', JSON.stringify(data, null, 2))

    return {
      status: response.status,
      data
    }
  } catch (error) {
    console.error('Cognitive Services Error:', error)
    throw error
  }
}

const testSpeechServices = async (endpoint: string, key: string) => {
  console.log('Starting Speech Services test...')
  if (!endpoint || !key) {
    console.error('Missing endpoint or key for Speech Services')
    throw new Error('Missing endpoint or key')
  }

  try {
    // Use the full endpoint for speech services
    const speechEndpoint = `${endpoint}/cognitiveservices/v1/voices/list`
    console.log('Testing Speech Services with URL:', speechEndpoint)
    console.log('Key provided (length):', key.length)
    
    const response = await fetch(speechEndpoint, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': key
      }
    })

    console.log('Speech Services Response Status:', response.status)
    const data = await response.json()
    console.log('Speech Services Response:', JSON.stringify(data, null, 2))

    return {
      status: response.status,
      data
    }
  } catch (error) {
    console.error('Speech Services Error:', error)
    throw error
  }
}

const testVisionServices = async (endpoint: string, key: string) => {
  console.log('Starting Vision Services test...')
  if (!endpoint || !key) {
    console.error('Missing endpoint or key for Vision Services')
    throw new Error('Missing endpoint or key')
  }

  try {
    const baseUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`
    const visionEndpoint = `${baseUrl}computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags`
    
    console.log('Testing Vision Services with URL:', visionEndpoint)
    console.log('Key provided (length):', key.length)
    
    const response = await fetch(visionEndpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
      })
    })

    console.log('Vision Services Response Status:', response.status)
    const data = await response.json()
    console.log('Vision Services Response:', JSON.stringify(data, null, 2))

    return {
      status: response.status,
      data
    }
  } catch (error) {
    console.error('Vision Services Error:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received request to test Azure services')
    const { endpoint, key, service } = await req.json()
    
    console.log('Testing service:', service)
    console.log('Using endpoint:', endpoint)
    console.log('Key length:', key?.length)

    let result
    switch (service) {
      case 'cognitive':
        result = await testCognitiveServices(endpoint, key)
        break
      case 'speech':
        result = await testSpeechServices(endpoint, key)
        break
      case 'vision':
        result = await testVisionServices(endpoint, key)
        break
      default:
        throw new Error(`Unknown service: ${service}`)
    }

    console.log(`${service} service test completed successfully`)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Error testing Azure services:', error)
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})