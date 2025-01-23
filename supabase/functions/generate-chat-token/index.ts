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
    const { personaId, config } = await req.json();
    
    if (!personaId) {
      throw new Error('personaId is required');
    }

    console.log('Generating token for persona:', { personaId, config });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get persona details
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      console.error('Persona fetch error:', personaError);
      throw new Error('Persona not found');
    }

    // Generate a secure token for the WebSocket connection
    const token = crypto.randomUUID();
    
    // Generate WebSocket URL with authentication token and persona config
    const wsUrl = `wss://realtime-chat.lovable.ai/chat?token=${token}&persona=${encodeURIComponent(JSON.stringify(config))}`;
    
    console.log('Generated WebSocket URL (token redacted):', wsUrl.replace(token, '[REDACTED]'));

    return new Response(JSON.stringify({ wsUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error instanceof Error ? error.stack : undefined 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});