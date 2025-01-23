import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AZURE_COGNITIVE_ENDPOINT = Deno.env.get('AZURE_COGNITIVE_ENDPOINT')
const AZURE_API_KEY = Deno.env.get('AZURE_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageData, userId, personaId } = await req.json()

    if (!imageData) {
      throw new Error('No image data provided')
    }

    // Call Azure Face API for emotion analysis
    const response = await fetch(`${AZURE_COGNITIVE_ENDPOINT}/face/v1.0/detect?returnFaceAttributes=emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': AZURE_API_KEY!,
      },
      body: JSON.stringify({
        url: imageData
      })
    })

    if (!response.ok) {
      throw new Error(`Azure Face API error: ${await response.text()}`)
    }

    const emotionData = await response.json()
    console.log('Emotion analysis result:', emotionData)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store emotion analysis results
    const { error: dbError } = await supabaseClient
      .from('emotion_analysis')
      .insert([
        {
          user_id: userId,
          persona_id: personaId,
          emotion_data: emotionData,
          created_at: new Date().toISOString()
        }
      ])

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true, data: emotionData }),
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