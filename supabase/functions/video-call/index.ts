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
    console.log('Processing video call request...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const requestData = await req.json();
    const { personaId, userId, action, personaConfig } = requestData;

    console.log('Request parameters:', { personaId, userId, action });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error('User verification failed:', userError);
      throw new Error('Invalid user or access denied');
    }

    switch (action) {
      case 'start': {
        if (!personaId || !personaConfig) {
          throw new Error('Persona ID and configuration are required');
        }

        console.log('Starting new video call session...');
        
        // Verify persona exists and is accessible to the user
        const { data: persona, error: personaError } = await supabase
          .from('personas')
          .select('*')
          .eq('id', personaId)
          .eq('user_id', userId)
          .single();

        if (personaError || !persona) {
          console.error('Persona verification failed:', personaError);
          throw new Error('Invalid persona or access denied');
        }

        // End any existing active sessions for this user
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
          console.error('Error ending existing sessions:', endError);
          // Continue anyway as this is not critical
        }

        // Generate unique IDs
        const conversationId = crypto.randomUUID();
        const videoCallId = crypto.randomUUID();

        // Create new session
        const { data: session, error: sessionError } = await supabase
          .from('tavus_sessions')
          .insert({
            conversation_id: conversationId,
            video_call_id: videoCallId,
            user_id: userId,
            status: 'active',
            participants: [
              { user_id: userId, type: 'user' },
              { persona_id: personaId, type: 'persona', config: personaConfig }
            ],
            is_active: true,
            session_type: 'video_call',
            last_checked_at: new Date().toISOString()
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
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});