import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

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
    const { type, sessionId, data } = await req.json();
    console.log(`Received ${type} signal for session ${sessionId}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store the signaling data in the database
    const { error: insertError } = await supabaseAdmin
      .from('tavus_sessions')
      .update({ 
        participants: data,
        updated_at: new Date().toISOString()
      })
      .eq('video_call_id', sessionId);

    if (insertError) {
      throw insertError;
    }

    // Broadcast the signal to other peers in the session
    const { data: session } = await supabaseAdmin
      .from('tavus_sessions')
      .select('*')
      .eq('video_call_id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    console.log(`Successfully processed ${type} signal for session ${sessionId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        type,
        data: session.participants 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in webrtc-signaling:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});