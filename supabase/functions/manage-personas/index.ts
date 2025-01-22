import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== Deno.env.get('PERSONA_API_KEY')) {
      throw new Error('Invalid API key');
    }

    const { method, action, data } = await req.json();
    console.log('Received request:', { method, action, data });

    let result;

    switch (method) {
      case 'POST':
        // Create new persona
        const { error: insertError, data: insertData } = await supabase
          .from('personas')
          .insert([{
            ...data,
            status: 'draft',
            emotion_settings: {
              sensitivity: 0.5,
              response_delay: 1000
            }
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        result = insertData;
        break;

      case 'GET':
        // Retrieve personas
        const { error: selectError, data: selectData } = await supabase
          .from('personas')
          .select('*')
          .eq('id', data.id);

        if (selectError) throw selectError;
        result = selectData;
        break;

      case 'PUT':
        // Update persona
        const { error: updateError, data: updateData } = await supabase
          .from('personas')
          .update(data)
          .eq('id', data.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = updateData;
        break;

      case 'DELETE':
        // Delete persona
        const { error: deleteError, data: deleteData } = await supabase
          .from('personas')
          .delete()
          .eq('id', data.id)
          .select()
          .single();

        if (deleteError) throw deleteError;
        result = deleteData;
        break;

      default:
        throw new Error('Invalid method');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-personas function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});