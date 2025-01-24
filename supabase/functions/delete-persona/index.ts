import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { personaId } = await req.json();
    console.log('Starting background deletion for persona:', personaId);

    // Get persona details first
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError) {
      throw personaError;
    }

    // Delete training materials from storage
    const { data: trainingMaterials, error: materialsError } = await supabase
      .from('persona_training_materials')
      .select('file_path')
      .eq('persona_id', personaId);

    if (materialsError) {
      console.error('Error fetching training materials:', materialsError);
    } else if (trainingMaterials?.length) {
      const { error: storageError } = await supabase.storage
        .from('training_materials')
        .remove(trainingMaterials.map(tm => tm.file_path));

      if (storageError) {
        console.error('Error deleting training materials from storage:', storageError);
      }
    }

    // Delete training videos from storage
    const { data: videos, error: videosError } = await supabase
      .from('training_videos')
      .select('video_url, consent_url')
      .eq('persona_id', personaId);

    if (videosError) {
      console.error('Error fetching training videos:', videosError);
    } else if (videos?.length) {
      const videoUrls = videos.flatMap(v => [v.video_url, v.consent_url].filter(Boolean));
      const { error: videoStorageError } = await supabase.storage
        .from('training_videos')
        .remove(videoUrls);

      if (videoStorageError) {
        console.error('Error deleting training videos from storage:', videoStorageError);
      }
    }

    // Delete profile picture if exists
    if (persona.profile_picture_url) {
      const { error: profilePicError } = await supabase.storage
        .from('persona_profiles')
        .remove([persona.profile_picture_url]);

      if (profilePicError) {
        console.error('Error deleting profile picture:', profilePicError);
      }
    }

    // Delete avatar if exists
    if (persona.avatar_url) {
      const { error: avatarError } = await supabase.storage
        .from('persona_assets')
        .remove([persona.avatar_url]);

      if (avatarError) {
        console.error('Error deleting avatar:', avatarError);
      }
    }

    // Delete all related database records
    const deleteOperations = [
      supabase.from('persona_training_materials').delete().eq('persona_id', personaId),
      supabase.from('training_videos').delete().eq('persona_id', personaId),
      supabase.from('emotion_analysis').delete().eq('persona_id', personaId),
      supabase.from('api_keys').delete().eq('persona_id', personaId),
      supabase.from('persona_appearances').delete().eq('persona_id', personaId),
      supabase.from('personas').delete().eq('id', personaId)
    ];

    const results = await Promise.allSettled(deleteOperations);
    
    // Log any errors that occurred during deletion
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Error in delete operation ${index}:`, result.reason);
      }
    });

    // Verify complete cleanup
    const verificationQueries = [
      supabase.from('personas').select('id').eq('id', personaId),
      supabase.from('persona_training_materials').select('id').eq('persona_id', personaId),
      supabase.from('training_videos').select('id').eq('persona_id', personaId),
      supabase.from('emotion_analysis').select('id').eq('persona_id', personaId),
      supabase.from('api_keys').select('id').eq('persona_id', personaId),
      supabase.from('persona_appearances').select('id').eq('persona_id', personaId)
    ];

    const verificationResults = await Promise.all(verificationQueries);
    const anyDataRemaining = verificationResults.some(result => result.data && result.data.length > 0);

    if (anyDataRemaining) {
      console.error('Warning: Some data still remains after deletion');
    } else {
      console.log('Verification complete: All data successfully deleted');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Deletion process completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-persona function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});