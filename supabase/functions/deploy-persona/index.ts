import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting persona deployment process...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { personaId } = await req.json();

    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    // Get persona details
    const { data: persona, error: personaError } = await supabaseClient
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      throw new Error('Failed to fetch persona details');
    }

    console.log('Fetched persona details:', persona);

    // Check if training materials exist
    const { data: trainingMaterials, error: materialsError } = await supabaseClient
      .from('persona_training_materials')
      .select('*')
      .eq('persona_id', personaId);

    if (materialsError) {
      throw materialsError;
    }

    if (!trainingMaterials || trainingMaterials.length === 0) {
      throw new Error('No training materials found. Please upload training data before deployment.');
    }

    // Update persona status to deployed and enable video call features
    const { error: updateError } = await supabaseClient
      .from('personas')
      .update({ 
        status: 'deployed',
        model_config: {
          ...persona.model_config,
          video_enabled: true,
          realtime_chat: true
        }
      })
      .eq('id', personaId);

    if (updateError) throw updateError;

    console.log('Persona deployed successfully');

    return new Response(
      JSON.stringify({ 
        message: 'Persona deployed successfully',
        persona: {
          ...persona,
          status: 'deployed'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in deploy-persona function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});