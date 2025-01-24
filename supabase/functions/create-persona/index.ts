import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const profilePicture = formData.get('profile_picture') as File;
    const trainingMaterials = formData.getAll('training_materials') as File[];

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) throw new Error('Invalid user token');

    // Upload profile picture if provided
    let profilePictureUrl = null;
    if (profilePicture) {
      const fileExt = profilePicture.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('persona_profiles')
        .upload(filePath, profilePicture, {
          contentType: profilePicture.type,
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('persona_profiles')
        .getPublicUrl(filePath);
      
      profilePictureUrl = publicUrl;
    }

    // Create the persona
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .insert({
        user_id: user.id,
        name,
        description,
        profile_picture_url: profilePictureUrl,
        status: 'pending',
        requires_training_video: true
      })
      .select()
      .single();

    if (personaError) throw personaError;

    // Upload and process training materials
    const trainingMaterialsData = [];
    for (const file of trainingMaterials) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${persona.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: materialUploadError } = await supabase.storage
        .from('training_materials')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (materialUploadError) throw materialUploadError;

      const { error: materialError } = await supabase
        .from('persona_training_materials')
        .insert({
          persona_id: persona.id,
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          status: 'pending'
        });

      if (materialError) throw materialError;

      trainingMaterialsData.push({
        name: file.name,
        type: file.type,
        path: filePath
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          persona,
          trainingMaterials: trainingMaterialsData
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-persona function:', error);
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