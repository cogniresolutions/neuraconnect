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

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const profilePicture = formData.get('profile_picture') as File;
    const trainingMaterial = formData.get('training_material') as File;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) throw new Error('Invalid user token');

    // Upload profile picture
    let profilePictureUrl = null;
    if (profilePicture) {
      const fileName = `${crypto.randomUUID()}.${profilePicture.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('persona_profiles')
        .upload(fileName, profilePicture);

      if (uploadError) throw uploadError;
      profilePictureUrl = uploadData.path;
    }

    // Create persona record
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .insert({
        user_id: user.id,
        name,
        description,
        profile_picture_url: profilePictureUrl,
        status: 'pending',
        model_config: {
          model: "gpt-4",
          max_tokens: 800,
          temperature: 0.7
        }
      })
      .select()
      .single();

    if (personaError) throw personaError;

    // Handle training material if provided
    if (trainingMaterial) {
      const fileName = `${crypto.randomUUID()}.${trainingMaterial.name.split('.').pop()}`;
      const { error: materialError } = await supabase.storage
        .from('training_materials')
        .upload(`${persona.id}/${fileName}`, trainingMaterial);

      if (materialError) throw materialError;

      await supabase
        .from('persona_training_materials')
        .insert({
          persona_id: persona.id,
          user_id: user.id,
          file_name: trainingMaterial.name,
          file_type: trainingMaterial.type,
          file_size: trainingMaterial.size,
          file_path: fileName,
        });
    }

    return new Response(
      JSON.stringify({ success: true, data: persona }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-persona function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});