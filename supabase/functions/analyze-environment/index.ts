import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AZURE_COGNITIVE_ENDPOINT = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
const AZURE_API_KEY = Deno.env.get('AZURE_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image_data, user_id, persona_id } = await req.json()

    if (!image_data) {
      throw new Error('No image data provided')
    }

    // Call Azure Computer Vision API for environment analysis
    const response = await fetch(`${AZURE_COGNITIVE_ENDPOINT}/vision/v3.2/analyze?visualFeatures=Categories,Objects,Tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': AZURE_API_KEY!,
      },
      body: JSON.stringify({
        url: image_data
      })
    })

    const environmentData = await response.json()
    console.log('Environment analysis result:', environmentData)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store environment analysis results
    const { data, error } = await supabaseClient
      .from('emotion_analysis')
      .update({ 
        environment_data: environmentData,
        environment_context: {
          objects: environmentData.objects?.map((obj: any) => obj.object) || [],
          tags: environmentData.tags?.map((tag: any) => tag.name) || [],
          categories: environmentData.categories?.map((cat: any) => cat.name) || []
        }
      })
      .match({ user_id, persona_id })
      .is('environment_data', null)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data: environmentData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})