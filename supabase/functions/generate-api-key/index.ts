import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user ID from the request
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get the request body
    const { name } = await req.json()
    if (!name) {
      throw new Error('API key name is required')
    }

    // Generate a random API key
    const apiKey = crypto.randomUUID()
    const keyHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(apiKey)
    )
    const hashArray = Array.from(new Uint8Array(keyHash))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Store the API key
    const { error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: hashHex,
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({
        apiKey,
        message: 'API key generated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})