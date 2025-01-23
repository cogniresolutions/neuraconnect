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
    console.log('Starting Azure services test...')
    
    // Get Azure credentials from environment
    const cognitiveEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
    const cognitiveKey = Deno.env.get('AZURE_COGNITIVE_KEY')
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY')
    const visionEndpoint = Deno.env.get('AZURE_VISION_ENDPOINT')
    const visionKey = Deno.env.get('AZURE_VISION_KEY')

    console.log('Credentials check:', {
      hasCognitiveEndpoint: !!cognitiveEndpoint,
      hasCognitiveKey: !!cognitiveKey,
      hasSpeechEndpoint: !!speechEndpoint,
      hasSpeechKey: !!speechKey,
      hasVisionEndpoint: !!visionEndpoint,
      hasVisionKey: !!visionKey
    })

    const results = []

    // Test Cognitive Services
    try {
      console.log('Testing Cognitive Services...')
      const cognitiveResponse = await fetch(`${cognitiveEndpoint}/vision/v3.2/analyze?visualFeatures=Description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': cognitiveKey || ''
        },
        body: JSON.stringify({
          url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
        })
      })

      console.log('Cognitive Services response status:', cognitiveResponse.status)
      results.push({
        service: 'Cognitive Services',
        status: cognitiveResponse.ok ? 'success' : 'error',
        statusCode: cognitiveResponse.status,
        error: cognitiveResponse.ok ? undefined : await cognitiveResponse.text()
      })
    } catch (error) {
      console.error('Cognitive Services error:', error)
      results.push({
        service: 'Cognitive Services',
        status: 'error',
        error: error.message
      })
    }

    // Test Speech Services
    try {
      console.log('Testing Speech Services...')
      const speechResponse = await fetch(`${speechEndpoint}/cognitiveservices/voices/list`, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey || ''
        }
      })

      console.log('Speech Services response status:', speechResponse.status)
      results.push({
        service: 'Speech Services',
        status: speechResponse.ok ? 'success' : 'error',
        statusCode: speechResponse.status,
        error: speechResponse.ok ? undefined : await speechResponse.text()
      })
    } catch (error) {
      console.error('Speech Services error:', error)
      results.push({
        service: 'Speech Services',
        status: 'error',
        error: error.message
      })
    }

    // Test Vision Services
    try {
      console.log('Testing Vision Services...')
      const visionResponse = await fetch(`${visionEndpoint}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': visionKey || ''
        },
        body: JSON.stringify({
          url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
        })
      })

      console.log('Vision Services response status:', visionResponse.status)
      results.push({
        service: 'Vision Services',
        status: visionResponse.ok ? 'success' : 'error',
        statusCode: visionResponse.status,
        error: visionResponse.ok ? undefined : await visionResponse.text()
      })
    } catch (error) {
      console.error('Vision Services error:', error)
      results.push({
        service: 'Vision Services',
        status: 'error',
        error: error.message
      })
    }

    console.log('Test results:', results)
    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in Azure test function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})