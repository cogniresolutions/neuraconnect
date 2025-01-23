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

    // Verify API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid API key');
    }
    const apiKey = authHeader.split(' ')[1];

    // Validate API key against api_keys table
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, is_active')
      .eq('key_hash', apiKey)
      .single();

    if (keyError || !keyData?.is_active) {
      throw new Error('Invalid or inactive API key');
    }

    const { name, training_data_url, profile_picture } = await req.json();

    // Create persona
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .insert({
        user_id: keyData.user_id,
        name,
        profile_picture_url: profile_picture,
        status: 'pending',
        requires_training_video: true
      })
      .select()
      .single();

    if (personaError) throw personaError;

    // If training data URL is provided, create training material record
    if (training_data_url) {
      const { error: trainingError } = await supabase
        .from('persona_training_materials')
        .insert({
          persona_id: persona.id,
          user_id: keyData.user_id,
          file_path: training_data_url,
          file_name: 'api_upload',
          file_type: 'url',
          file_size: 0,
          status: 'pending'
        });

      if (trainingError) throw trainingError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: persona,
        message: 'Persona created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in api-personas function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});