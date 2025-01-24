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
    const { action, conversationId, sessionId, metadata } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) throw new Error('Invalid user token');

    let result;

    switch (action) {
      case 'create':
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('conversation_sessions')
          .insert({
            conversation_id: conversationId,
            session_type: 'chat',
            status: 'active',
            metadata: {
              started_at: new Date().toISOString(),
              ...metadata
            }
          })
          .select()
          .single();

        if (createError) throw createError;
        result = newSession;
        break;

      case 'end':
        // End specific session
        const { data: endedSession, error: endError } = await supabase
          .from('conversation_sessions')
          .update({
            status: 'ended',
            metadata: {
              ...metadata,
              ended_at: new Date().toISOString()
            }
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (endError) throw endError;
        result = endedSession;
        break;

      case 'list':
        // List all sessions for a conversation
        const { data: sessions, error: listError } = await supabase
          .from('conversation_sessions')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false });

        if (listError) throw listError;
        result = sessions;
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-sessions function:', error);
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