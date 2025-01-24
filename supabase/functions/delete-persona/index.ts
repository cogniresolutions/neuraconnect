import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { personaId } = await req.json()

    if (!personaId) {
      throw new Error('Persona ID is required')
    }

    console.log('Starting deletion process for persona:', personaId)

    // First verify the persona exists
    const { data: persona, error: personaError } = await supabaseClient
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single()

    if (personaError || !persona) {
      throw new Error('Persona not found')
    }

    // Delete files from storage
    if (persona.avatar_url) {
      const { error: avatarError } = await supabaseClient
        .storage
        .from('persona_assets')
        .remove([persona.avatar_url])

      if (avatarError) {
        console.error('Error deleting avatar:', avatarError)
      }
    }

    if (persona.profile_picture_url) {
      const { error: profilePicError } = await supabaseClient
        .storage
        .from('persona_profiles')
        .remove([persona.profile_picture_url])

      if (profilePicError) {
        console.error('Error deleting profile picture:', profilePicError)
      }
    }

    // Get and delete training materials
    const { data: trainingMaterials } = await supabaseClient
      .from('persona_training_materials')
      .select('file_path')
      .eq('persona_id', personaId)

    if (trainingMaterials?.length) {
      const { error: materialsError } = await supabaseClient
        .storage
        .from('training_materials')
        .remove(trainingMaterials.map(tm => tm.file_path))

      if (materialsError) {
        console.error('Error deleting training materials:', materialsError)
      }
    }

    // Get and delete training videos
    const { data: trainingVideos } = await supabaseClient
      .from('training_videos')
      .select('video_url, consent_url')
      .eq('persona_id', personaId)

    if (trainingVideos?.length) {
      const videoUrls = trainingVideos.flatMap(tv => [tv.video_url, tv.consent_url].filter(Boolean))
      const { error: videosError } = await supabaseClient
        .storage
        .from('training_videos')
        .remove(videoUrls)

      if (videosError) {
        console.error('Error deleting training videos:', videosError)
      }
    }

    // Delete all related database records in the correct order
    const deleteOperations = [
      // First delete child records
      supabaseClient.from('conversation_sessions').delete().eq('conversation_id', personaId),
      supabaseClient.from('conversations').delete().eq('persona_id', personaId),
      supabaseClient.from('persona_training_materials').delete().eq('persona_id', personaId),
      supabaseClient.from('training_videos').delete().eq('persona_id', personaId),
      supabaseClient.from('emotion_analysis').delete().eq('persona_id', personaId),
      supabaseClient.from('api_keys').delete().eq('persona_id', personaId),
      supabaseClient.from('persona_appearances').delete().eq('persona_id', personaId),
      // Finally delete the persona itself
      supabaseClient.from('personas').delete().eq('id', personaId)
    ]

    // Execute all delete operations
    const deleteResults = await Promise.all(deleteOperations)
    const deleteErrors = deleteResults.filter(result => result.error)

    if (deleteErrors.length > 0) {
      console.error('Errors during deletion:', deleteErrors)
      throw new Error('Failed to delete some related records')
    }

    // Verify complete deletion
    const verificationQueries = [
      supabaseClient.from('conversations').select('id').eq('persona_id', personaId),
      supabaseClient.from('persona_training_materials').select('id').eq('persona_id', personaId),
      supabaseClient.from('training_videos').select('id').eq('persona_id', personaId),
      supabaseClient.from('emotion_analysis').select('id').eq('persona_id', personaId),
      supabaseClient.from('api_keys').select('id').eq('persona_id', personaId),
      supabaseClient.from('persona_appearances').select('id').eq('persona_id', personaId),
      supabaseClient.from('personas').select('id').eq('id', personaId)
    ]

    const verificationResults = await Promise.all(verificationQueries)
    const anyDataRemaining = verificationResults.some(result => result.data?.length > 0)

    if (anyDataRemaining) {
      console.error('Warning: Some data still remains after deletion')
      throw new Error('Incomplete deletion detected')
    }

    console.log('Verification complete: All data successfully deleted')

    return new Response(
      JSON.stringify({ success: true, message: 'Deletion process completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})