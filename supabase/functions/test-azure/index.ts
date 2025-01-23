import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 Azure Test Function Started')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Azure credentials from environment
    const cognitiveEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
    const cognitiveKey = Deno.env.get('AZURE_COGNITIVE_KEY')
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY')
    const visionEndpoint = Deno.env.get('AZURE_VISION_ENDPOINT')
    const visionKey = Deno.env.get('AZURE_VISION_KEY')

    console.log('📝 Environment Variables Check:', {
      hasCognitiveEndpoint: !!cognitiveEndpoint,
      cognitiveEndpointLength: cognitiveEndpoint?.length,
      hasCognitiveKey: !!cognitiveKey,
      cognitiveKeyLength: cognitiveKey?.length,
      hasSpeechEndpoint: !!speechEndpoint,
      speechEndpointLength: speechEndpoint?.length,
      hasSpeechKey: !!speechKey,
      speechKeyLength: speechKey?.length,
      hasVisionEndpoint: !!visionEndpoint,
      visionEndpointLength: visionEndpoint?.length,
      hasVisionKey: !!visionKey,
      visionKeyLength: visionKey?.length
    })

    const results = []

    // Test Cognitive Services
    try {
      console.log('🧠 Testing Cognitive Services...')
      console.log('Cognitive Services URL:', `${cognitiveEndpoint}/vision/v3.2/analyze?visualFeatures=Description`)
      
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

      console.log('Cognitive Services Response:', {
        status: cognitiveResponse.status,
        statusText: cognitiveResponse.statusText,
        headers: Object.fromEntries(cognitiveResponse.headers.entries())
      })

      const responseText = await cognitiveResponse.text()
      console.log('Cognitive Services Response Body:', responseText)

      results.push({
        service: 'Cognitive Services',
        status: cognitiveResponse.ok ? 'success' : 'error',
        statusCode: cognitiveResponse.status,
        error: cognitiveResponse.ok ? undefined : responseText
      })
    } catch (error) {
      console.error('❌ Cognitive Services Error:', error)
      results.push({
        service: 'Cognitive Services',
        status: 'error',
        error: error.message
      })
    }

    // Test Speech Services
    try {
      console.log('🗣️ Testing Speech Services...')
      console.log('Speech Services URL:', `${speechEndpoint}/cognitiveservices/voices/list`)
      
      const speechResponse = await fetch(`${speechEndpoint}/cognitiveservices/voices/list`, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey || ''
        }
      })

      console.log('Speech Services Response:', {
        status: speechResponse.status,
        statusText: speechResponse.statusText,
        headers: Object.fromEntries(speechResponse.headers.entries())
      })

      const responseText = await speechResponse.text()
      console.log('Speech Services Response Body:', responseText)

      results.push({
        service: 'Speech Services',
        status: speechResponse.ok ? 'success' : 'error',
        statusCode: speechResponse.status,
        error: speechResponse.ok ? undefined : responseText
      })
    } catch (error) {
      console.error('❌ Speech Services Error:', error)
      results.push({
        service: 'Speech Services',
        status: 'error',
        error: error.message
      })
    }

    // Test Vision Services
    try {
      console.log('👁️ Testing Vision Services...')
      console.log('Vision Services URL:', `${visionEndpoint}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags`)
      
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

      console.log('Vision Services Response:', {
        status: visionResponse.status,
        statusText: visionResponse.statusText,
        headers: Object.fromEntries(visionResponse.headers.entries())
      })

      const responseText = await visionResponse.text()
      console.log('Vision Services Response Body:', responseText)

      results.push({
        service: 'Vision Services',
        status: visionResponse.ok ? 'success' : 'error',
        statusCode: visionResponse.status,
        error: visionResponse.ok ? undefined : responseText
      })
    } catch (error) {
      console.error('❌ Vision Services Error:', error)
      results.push({
        service: 'Vision Services',
        status: 'error',
        error: error.message
      })
    }

    console.log('✅ Final Test Results:', results)
    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Fatal Error in Azure test function:', error)
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