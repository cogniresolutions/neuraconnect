import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { personaId } = await req.json();
    console.log('Deploying persona:', personaId);

    // Get the persona data
    const { data: persona, error: fetchError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (fetchError) {
      console.error('Error fetching persona:', fetchError);
      throw fetchError;
    }

    // Update deployment status
    const { error: updateError } = await supabase
      .from('personas')
      .update({ status: 'deploying' })
      .eq('id', personaId);

    if (updateError) {
      console.error('Error updating persona status:', updateError);
      throw updateError;
    }

    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update status to deployed
    const { error: finalUpdateError } = await supabase
      .from('personas')
      .update({ status: 'deployed' })
      .eq('id', personaId);

    if (finalUpdateError) {
      console.error('Error updating final persona status:', finalUpdateError);
      throw finalUpdateError;
    }

    console.log('Persona deployment completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Persona deployment initiated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in deploy-persona function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to deploy persona",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});