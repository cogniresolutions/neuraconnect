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

    // Verify API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid API key');
    }
    const apiKey = authHeader.split(' ')[1];

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, is_active, persona_id')
      .eq('key_hash', apiKey)
      .single();

    if (keyError || !keyData?.is_active) {
      throw new Error('Invalid or inactive API key');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (req.method === 'POST' && path === 'start') {
      const { persona_id, conversation_context } = await req.json();

      // Create new conversation session
      const { data: session, error: sessionError } = await supabase
        .from('tavus_sessions')
        .insert({
          user_id: keyData.user_id,
          conversation_id: crypto.randomUUID(),
          status: 'active',
          participants: [{ user_id: keyData.user_id }],
          context: conversation_context
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      return new Response(
        JSON.stringify({
          success: true,
          data: session,
          message: 'Conversation started successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'GET' && path === 'history') {
      // Get conversation history
      const { data: history, error: historyError } = await supabase
        .from('tavus_sessions')
        .select('*')
        .eq('user_id', keyData.user_id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      return new Response(
        JSON.stringify({
          success: true,
          data: history,
          message: 'Conversation history retrieved successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid endpoint or method');

  } catch (error) {
    console.error('Error in api-conversations function:', error);
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