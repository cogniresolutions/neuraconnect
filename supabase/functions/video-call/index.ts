import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, userId, personaId, personaConfig } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      throw new Error('Invalid user or access denied');
    }

    switch (action) {
      case 'start': {
        if (!personaId || !personaConfig) {
          throw new Error('Persona ID and config are required');
        }

        // Verify persona exists and belongs to user
        const { data: persona, error: personaError } = await supabaseClient
          .from('personas')
          .select('*')
          .eq('id', personaId)
          .eq('user_id', userId)
          .single();

        if (personaError || !persona) {
          throw new Error('Invalid persona or access denied');
        }

        // End existing active sessions
        await supabaseClient
          .from('tavus_sessions')
          .update({ 
            status: 'ended', 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('is_active', true);

        // Create new session
        const conversationId = crypto.randomUUID();
        const videoCallId = crypto.randomUUID();

        const { data: session, error: sessionError } = await supabaseClient
          .from('tavus_sessions')
          .insert({
            conversation_id: conversationId,
            video_call_id: videoCallId,
            user_id: userId,
            status: 'active',
            is_active: true,
            session_type: 'video_call',
            participants: [{ user_id: userId }]
          })
          .select()
          .single();

        if (sessionError) {
          throw new Error('Failed to create session');
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              sessionId: session.id,
              conversationId,
              videoCallId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'end': {
        const { data, error } = await supabaseClient
          .from('tavus_sessions')
          .update({ 
            status: 'ended',
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) {
          throw new Error('Failed to end session');
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error.message);
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