import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Get Voice Mappings Function loaded')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First try to get existing mappings
    const { data: existingMappings, error: fetchError } = await supabaseClient
      .from('voice_mappings')
      .select('*')
      .order('display_name')

    if (fetchError) throw fetchError

    // If no mappings exist, sync them first
    if (!existingMappings || existingMappings.length === 0) {
      console.log('No voice mappings found, syncing from Azure...')
      
      const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY')
      if (!azureSpeechKey) {
        throw new Error('Azure Speech Key not configured')
      }

      // Fetch available voices from Azure
      const response = await fetch(
        'https://eastus.tts.speech.microsoft.com/cognitiveservices/voices/list',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': azureSpeechKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`)
      }

      const voices = await response.json()

      // Transform and filter voices
      const voiceMappings = voices
        .filter((voice: any) => voice.Locale.match(/^(en-US|en-GB|es-ES|fr-FR|de-DE|it-IT|ja-JP|ko-KR|zh-CN)/))
        .map((voice: any) => {
          const shortName = voice.ShortName.replace('Neural', '').trim()
          const displayName = shortName.split('-').pop() || ''
          const gender = voice.Gender.toLowerCase()
          
          return {
            language_code: voice.Locale,
            voice_style: displayName,
            gender: gender,
            azure_voice_name: voice.ShortName,
            display_name: `${displayName} (${gender === 'female' ? 'Female' : 'Male'})`
          }
        })

      // Insert new mappings
      const { error: insertError } = await supabaseClient
        .from('voice_mappings')
        .insert(voiceMappings)

      if (insertError) throw insertError

      // Return newly created mappings
      return new Response(
        JSON.stringify({ 
          success: true,
          data: voiceMappings,
          message: 'Voice mappings synced and retrieved successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return existing mappings
    return new Response(
      JSON.stringify({ 
        success: true,
        data: existingMappings,
        message: 'Voice mappings retrieved successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})