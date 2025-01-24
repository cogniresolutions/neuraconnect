import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
    const endpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    
    if (!endpoint) {
      throw new Error('Azure OpenAI endpoint not configured');
    }

    if (!apiKey) {
      throw new Error('Azure OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get persona details
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      throw new Error('Persona not found');
    }

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // Create a token payload
    const tokenPayload = {
      session_id: sessionId,
      persona_id: personaId,
      config: {
        ...config,
        system_prompt: persona.system_prompt,
        knowledge_base: persona.knowledge_base,
        conversation_style: persona.conversation_style,
      },
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    };

    // Encode the token payload
    const token = base64Encode(JSON.stringify(tokenPayload));

    // Store session information
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        id: sessionId,
        persona_id: personaId,
        token: token,
        status: 'active',
        config: tokenPayload.config
      });

    if (sessionError) {
      throw new Error(`Failed to create chat session: ${sessionError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        token,
        endpoint,
        session_id: sessionId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error generating chat token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});