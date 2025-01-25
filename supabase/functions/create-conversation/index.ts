import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { persona_id, user_id } = await req.json()

    if (!persona_id || !user_id) {
      throw new Error('Missing required parameters')
    }

    console.log('Creating conversation for persona:', persona_id, 'and user:', user_id)

    // Create a new conversation
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .insert({
        persona_id,
        user_id,
        status: 'active',
        title: `Video Call ${new Date().toISOString()}`,
      })
      .select()
      .single()

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      throw conversationError
    }

    console.log('Conversation created:', conversation)

    // Create a new session for the conversation
    const { data: session, error: sessionError } = await supabaseClient
      .from('conversation_sessions')
      .insert({
        conversation_id: conversation.id,
        session_type: 'video',
        status: 'active',
        metadata: {
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      throw sessionError
    }

    console.log('Session created:', session)

    return new Response(
      JSON.stringify({
        conversation: conversation,
        session: session,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})