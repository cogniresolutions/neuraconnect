import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { name, description, voiceStyle, personality, personaId } = await req.json();

    // First, generate a personality profile using GPT-4
    const personalityResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI personality designer. Create a detailed personality profile based on the given inputs."
          },
          {
            role: "user",
            content: `Create a personality profile for an AI persona with the following details:
              Name: ${name}
              Description: ${description}
              Voice Style: ${voiceStyle}
              Personality Traits: ${personality}`
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!personalityResponse.ok) {
      throw new Error("Failed to generate personality profile");
    }

    const personalityData = await personalityResponse.json();
    const generatedProfile = personalityData.choices[0].message.content;

    // Update the persona record with the generated profile
    const { data: client, error: updateError } = await supabase
      .from('personas')
      .update({ 
        personality: generatedProfile,
        status: 'ready'
      })
      .eq('id', personaId)
      .select();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        profile: generatedProfile,
        message: "Persona created successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-persona function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create persona",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});