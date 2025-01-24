import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const AZURE_OPENAI_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");
const AZURE_OPENAI_ENDPOINT = "https://neuraconnect.openai.azure.com";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
      return new Response(
        JSON.stringify({ error: "Azure OpenAI credentials are not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Making request to Azure OpenAI...");
    
    const deploymentName = "gpt-4o-mini";
    const apiVersion = "2024-02-15-preview";
    
    const completion = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
      {
        method: "POST",
        headers: {
          "api-key": AZURE_OPENAI_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: [{
                type: "text",
                text: "You are a lovable and empathetic virtual assistant named Loveable. You provide thoughtful, warm, and context-aware interactions. Your personality is friendly, kind, and curious."
              }]
            },
            {
              role: "user",
              content: [{
                type: "text",
                text: message
              }]
            }
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 800,
        }),
      }
    );

    if (!completion.ok) {
      const error = await completion.text();
      console.error("Azure OpenAI API error:", error);
      throw new Error(`Azure OpenAI API error: ${error}`);
    }

    const data = await completion.json();
    console.log("Azure OpenAI response received:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from Azure OpenAI");
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