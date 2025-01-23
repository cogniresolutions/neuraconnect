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
    const { conversationId, context, maxSessions } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) throw new Error('Invalid user token');

    // Create the conversation session
    const { data: session, error: sessionError } = await supabase
      .from('tavus_sessions')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        status: 'active',
        session_type: 'video_call',
        is_active: true,
        participants: [],
        max_sessions: maxSessions,
        context: context || null
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    return new Response(
      JSON.stringify({
        success: true,
        data: session,
        message: 'Conversation created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating conversation:', error);
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