import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Initializing delete-persona function');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { personaId } = await req.json();
    console.log('Received request to delete persona:', personaId);

    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    // First verify the persona exists
    const { data: persona, error: personaError } = await supabaseClient
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      console.error('Persona not found:', personaError);
      throw new Error('Persona not found');
    }

    console.log('Found persona to delete:', persona.name);

    // Delete files from storage
    if (persona.avatar_url) {
      console.log('Deleting avatar from storage:', persona.avatar_url);
      const { error: avatarError } = await supabaseClient
        .storage
        .from('persona_assets')
        .remove([persona.avatar_url]);

      if (avatarError) {
        console.error('Error deleting avatar:', avatarError);
      }
    }

    if (persona.profile_picture_url) {
      console.log('Deleting profile picture from storage:', persona.profile_picture_url);
      const { error: profilePicError } = await supabaseClient
        .storage
        .from('persona_profiles')
        .remove([persona.profile_picture_url]);

      if (profilePicError) {
        console.error('Error deleting profile picture:', profilePicError);
      }
    }

    // Get and delete training materials
    console.log('Fetching training materials for deletion');
    const { data: trainingMaterials } = await supabaseClient
      .from('persona_training_materials')
      .select('file_path')
      .eq('persona_id', personaId);

    if (trainingMaterials?.length) {
      console.log('Deleting training materials:', trainingMaterials.length, 'files');
      const { error: materialsError } = await supabaseClient
        .storage
        .from('training_materials')
        .remove(trainingMaterials.map(tm => tm.file_path));

      if (materialsError) {
        console.error('Error deleting training materials:', materialsError);
      }
    }

    // Get and delete training videos
    console.log('Fetching training videos for deletion');
    const { data: trainingVideos } = await supabaseClient
      .from('training_videos')
      .select('video_url, consent_url')
      .eq('persona_id', personaId);

    if (trainingVideos?.length) {
      console.log('Deleting training videos:', trainingVideos.length, 'files');
      const videoUrls = trainingVideos.flatMap(tv => [tv.video_url, tv.consent_url].filter(Boolean));
      const { error: videosError } = await supabaseClient
        .storage
        .from('training_videos')
        .remove(videoUrls);

      if (videosError) {
        console.error('Error deleting training videos:', videosError);
      }
    }

    // Delete all related database records in the correct order
    console.log('Starting cascading deletion of database records');
    const deleteOperations = [
      supabaseClient.from('conversation_sessions').delete().eq('conversation_id', personaId),
      supabaseClient.from('conversations').delete().eq('persona_id', personaId),
      supabaseClient.from('persona_training_materials').delete().eq('persona_id', personaId),
      supabaseClient.from('training_videos').delete().eq('persona_id', personaId),
      supabaseClient.from('emotion_analysis').delete().eq('persona_id', personaId),
      supabaseClient.from('api_keys').delete().eq('persona_id', personaId),
      supabaseClient.from('persona_appearances').delete().eq('persona_id', personaId),
      supabaseClient.from('personas').delete().eq('id', personaId)
    ];

    const deleteResults = await Promise.all(deleteOperations);
    const deleteErrors = deleteResults.filter(result => result.error);

    if (deleteErrors.length > 0) {
      console.error('Errors during deletion:', deleteErrors);
      throw new Error('Failed to delete some related records');
    }

    console.log('Successfully deleted all database records');

    // Verify complete deletion
    console.log('Verifying complete deletion');
    const verificationQueries = [
      supabaseClient.from('conversations').select('id').eq('persona_id', personaId),
      supabaseClient.from('persona_training_materials').select('id').eq('persona_id', personaId),
      supabaseClient.from('training_videos').select('id').eq('persona_id', personaId),
      supabaseClient.from('emotion_analysis').select('id').eq('persona_id', personaId),
      supabaseClient.from('api_keys').select('id').eq('persona_id', personaId),
      supabaseClient.from('persona_appearances').select('id').eq('persona_id', personaId),
      supabaseClient.from('personas').select('id').eq('id', personaId)
    ];

    const verificationResults = await Promise.all(verificationQueries);
    const anyDataRemaining = verificationResults.some(result => result.data?.length > 0);

    if (anyDataRemaining) {
      console.error('Warning: Some data still remains after deletion');
      throw new Error('Incomplete deletion detected');
    }

    console.log('Verification complete: All data successfully deleted');

    return new Response(
      JSON.stringify({ success: true, message: 'Deletion process completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete persona function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});