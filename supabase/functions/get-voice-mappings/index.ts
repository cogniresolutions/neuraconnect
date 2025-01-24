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
    const azureSpeechKey = Deno.env.get('AZURE_SPEECH_KEY')
    if (!azureSpeechKey) {
      throw new Error('Azure Speech Key not configured')
    }

    // Fetch available voices from Azure
    console.log('Fetching voices from Azure...')
    const response = await fetch(
      'https://eastus.tts.speech.microsoft.com/cognitiveservices/voices/list',
      {
        headers: {
          'Ocp-Apim-Subscription-Key': azureSpeechKey,
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch voices:', response.statusText)
      throw new Error(`Failed to fetch voices: ${response.statusText}`)
    }

    const voices = await response.json()
    console.log('Fetched voices from Azure:', voices.length)

    // Filter and transform the voices data
    const voiceMappings = voices
      .filter((voice: any) => {
        // Only include Neural voices for supported languages
        return voice.VoiceType === "Neural" &&
               voice.Locale.match(/^(en-US|en-GB|es-ES|fr-FR|de-DE|it-IT|ja-JP|ko-KR|zh-CN)/)
      })
      .map((voice: any) => {
        const shortName = voice.ShortName.replace('Neural', '')
        return {
          language_code: voice.Locale,
          voice_style: shortName,
          gender: voice.Gender.toLowerCase(),
          azure_voice_name: voice.ShortName,
          display_name: `${voice.LocalName || shortName} (${voice.Gender})`
        }
      })

    console.log('Transformed voice mappings:', voiceMappings.length)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Clear existing mappings and insert new ones
    const { error: deleteError } = await supabaseClient
      .from('voice_mappings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.error('Failed to clear existing mappings:', deleteError)
      throw new Error(`Failed to clear existing mappings: ${deleteError.message}`)
    }

    const { error: insertError } = await supabaseClient
      .from('voice_mappings')
      .insert(voiceMappings)

    if (insertError) {
      console.error('Failed to insert new mappings:', insertError)
      throw new Error(`Failed to insert new mappings: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: voiceMappings,
        message: 'Voice mappings synchronized successfully'
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