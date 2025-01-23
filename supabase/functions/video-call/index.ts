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
    const { personaId, userId, action, personaConfig } = await req.json();
    console.log('Received request:', { personaId, userId, action, personaConfig });
    
    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get persona details
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError) {
      console.error('Error fetching persona:', personaError);
      throw personaError;
    }
    if (!persona) {
      console.error('Persona not found');
      throw new Error('Persona not found');
    }

    console.log('Found persona:', persona.name);

    // Generate a unique conversation ID
    const conversationId = crypto.randomUUID();
    console.log('Generated conversation ID:', conversationId);

    // Create a new tavus session
    const { data: session, error: sessionError } = await supabase
      .from('tavus_sessions')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        status: 'active',
        video_call_id: crypto.randomUUID(),
        participants: [],
        is_active: true,
        session_type: 'video_call'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw sessionError;
    }

    console.log('Created new session:', session);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          conversationId,
          session
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in video-call function:', error);
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