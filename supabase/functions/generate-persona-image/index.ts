import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import OpenAI from "https://esm.sh/openai@4.20.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { description, style } = await req.json()

    if (!description) {
      throw new Error('Description is required')
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional headshot of a ${description}. High quality, photorealistic, front-facing, neutral background.`,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: style || "natural"
    })

    const imageUrl = response.data[0].url

    // Download and store image in Supabase
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileName = `${crypto.randomUUID()}.png`
    const filePath = `generated/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('persona_assets')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('persona_assets')
      .getPublicUrl(filePath)

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating persona image:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})