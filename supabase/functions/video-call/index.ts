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
    console.log('Processing video call request...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { personaId, userId, action, personaConfig } = await req.json();

    if (!personaId || !userId) {
      console.error('Missing required parameters:', { personaId, userId });
      throw new Error('Missing required parameters');
    }

    console.log('Request details:', { action, personaId, userId });

    switch (action) {
      case 'start': {
        console.log('Starting new video call session...');
        // Verify persona exists and is accessible to the user
        const { data: persona, error: personaError } = await supabase
          .from('personas')
          .select('*')
          .eq('id', personaId)
          .single();

        if (personaError || !persona) {
          console.error('Persona verification failed:', personaError);
          throw new Error('Invalid persona or access denied');
        }

        // Generate a unique conversation ID
        const conversationId = crypto.randomUUID();
        console.log('Generated conversation ID:', conversationId);

        const { data: session, error: sessionError } = await supabase
          .from('tavus_sessions')
          .insert({
            user_id: userId,
            conversation_id: conversationId,
            status: 'active',
            participants: [
              { user_id: userId, type: 'user' },
              { persona_id: personaId, type: 'persona', config: personaConfig }
            ],
            session_type: 'video_call',
            is_active: true
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Session creation failed:', sessionError);
          throw sessionError;
        }

        console.log('Video call session created:', session);

        return new Response(
          JSON.stringify({ 
            success: true, 
            session,
            message: 'Video call session started successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'end': {
        console.log('Ending video call session...');
        const { error: endError } = await supabase
          .from('tavus_sessions')
          .update({ 
            status: 'ended', 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('is_active', true);

        if (endError) {
          console.error('Session end failed:', endError);
          throw endError;
        }

        console.log('Video call session ended successfully');

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Video call session ended successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Video call error:', error);
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