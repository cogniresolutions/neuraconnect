import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Use Deno.stdout.write to ensure logs are captured
  await Deno.stdout.write(new TextEncoder().encode("🚀 Azure Test Function Started\n"))
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      await Deno.stdout.write(new TextEncoder().encode("Handling CORS preflight request\n"))
      return new Response(null, { 
        headers: corsHeaders,
        status: 200
      })
    }

    // Parse request body
    const body = await req.json().catch(async (error) => {
      await Deno.stdout.write(new TextEncoder().encode(`Failed to parse request body: ${error}\n`))
      throw new Error('Invalid request body')
    })
    await Deno.stdout.write(new TextEncoder().encode(`Request body: ${JSON.stringify(body)}\n`))

    // Get Azure credentials from environment
    const cognitiveEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
    const cognitiveKey = Deno.env.get('AZURE_COGNITIVE_KEY')
    const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT')
    const speechKey = Deno.env.get('AZURE_SPEECH_KEY')
    const visionEndpoint = Deno.env.get('AZURE_VISION_ENDPOINT')
    const visionKey = Deno.env.get('AZURE_VISION_KEY')

    await Deno.stdout.write(new TextEncoder().encode("📝 Environment Variables Check:\n"))
    await Deno.stdout.write(new TextEncoder().encode(JSON.stringify({
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
    }, null, 2) + "\n"))

    if (!cognitiveEndpoint || !cognitiveKey || !speechEndpoint || !speechKey || !visionEndpoint || !visionKey) {
      await Deno.stdout.write(new TextEncoder().encode("❌ Missing required Azure credentials\n"))
      return new Response(
        JSON.stringify({
          error: 'Missing required Azure credentials',
          details: 'Please check your Azure configuration in Supabase Edge Function secrets'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const results = []

    // Test Cognitive Services
    try {
      await Deno.stdout.write(new TextEncoder().encode("🧠 Testing Cognitive Services...\n"))
      
      const cognitiveResponse = await fetch(`${cognitiveEndpoint}/vision/v3.2/analyze?visualFeatures=Description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': cognitiveKey
        },
        body: JSON.stringify({
          url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
        })
      })

      await Deno.stdout.write(new TextEncoder().encode(`Cognitive Services Response: ${cognitiveResponse.status}\n`))
      const cognitiveText = await cognitiveResponse.text()
      await Deno.stdout.write(new TextEncoder().encode(`Cognitive Services Response Body: ${cognitiveText}\n`))

      results.push({
        service: 'Cognitive Services',
        status: cognitiveResponse.ok ? 'success' : 'error',
        statusCode: cognitiveResponse.status,
        error: cognitiveResponse.ok ? undefined : cognitiveText
      })
    } catch (error) {
      await Deno.stdout.write(new TextEncoder().encode(`❌ Cognitive Services Error: ${error}\n`))
      results.push({
        service: 'Cognitive Services',
        status: 'error',
        error: error.message
      })
    }

    // Test Speech Services
    try {
      await Deno.stdout.write(new TextEncoder().encode("🗣️ Testing Speech Services...\n"))
      
      const speechResponse = await fetch(`${speechEndpoint}/cognitiveservices/voices/list`, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey
        }
      })

      await Deno.stdout.write(new TextEncoder().encode(`Speech Services Response: ${speechResponse.status}\n`))
      const speechText = await speechResponse.text()
      await Deno.stdout.write(new TextEncoder().encode(`Speech Services Response Body: ${speechText}\n`))

      results.push({
        service: 'Speech Services',
        status: speechResponse.ok ? 'success' : 'error',
        statusCode: speechResponse.status,
        error: speechResponse.ok ? undefined : speechText
      })
    } catch (error) {
      await Deno.stdout.write(new TextEncoder().encode(`❌ Speech Services Error: ${error}\n`))
      results.push({
        service: 'Speech Services',
        status: 'error',
        error: error.message
      })
    }

    // Test Vision Services
    try {
      await Deno.stdout.write(new TextEncoder().encode("👁️ Testing Vision Services...\n"))
      
      const visionResponse = await fetch(`${visionEndpoint}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': visionKey
        },
        body: JSON.stringify({
          url: 'https://learn.microsoft.com/azure/cognitive-services/computer-vision/images/windows-kitchen.jpg'
        })
      })

      await Deno.stdout.write(new TextEncoder().encode(`Vision Services Response: ${visionResponse.status}\n`))
      const visionText = await visionResponse.text()
      await Deno.stdout.write(new TextEncoder().encode(`Vision Services Response Body: ${visionText}\n`))

      results.push({
        service: 'Vision Services',
        status: visionResponse.ok ? 'success' : 'error',
        statusCode: visionResponse.status,
        error: visionResponse.ok ? undefined : visionText
      })
    } catch (error) {
      await Deno.stdout.write(new TextEncoder().encode(`❌ Vision Services Error: ${error}\n`))
      results.push({
        service: 'Vision Services',
        status: 'error',
        error: error.message
      })
    }

    await Deno.stdout.write(new TextEncoder().encode(`✅ Final Test Results: ${JSON.stringify(results, null, 2)}\n`))
    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    await Deno.stdout.write(new TextEncoder().encode(`❌ Fatal Error in Azure test function: ${error}\n`))
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
