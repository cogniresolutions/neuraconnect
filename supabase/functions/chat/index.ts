import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    const { message } = await req.json();
    console.log("Received message:", message);

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Making request to OpenAI...");

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "You are a lovable and empathetic virtual assistant named Loveable. You provide thoughtful, warm, and context-aware interactions. Your personality is friendly, kind, and curious."
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!completion.ok) {
      const error = await completion.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await completion.json();
    console.log("OpenAI response received:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI");
    }

    const response = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error in chat function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred",
        details: error
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});