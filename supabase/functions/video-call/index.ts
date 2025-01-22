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

    const { personaId, userId, action } = await req.json();

    if (!personaId || !userId) {
      throw new Error('Missing required parameters');
    }

    switch (action) {
      case 'start':
        const { data: session, error: sessionError } = await supabase
          .from('tavus_sessions')
          .insert({
            user_id: userId,
            status: 'active',
            participants: [{ user_id: userId, type: 'user' }],
            session_type: 'video_call'
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        return new Response(
          JSON.stringify({ success: true, session }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'end':
        const { error: endError } = await supabase
          .from('tavus_sessions')
          .update({ status: 'ended', is_active: false })
          .eq('id', personaId);

        if (endError) throw endError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});