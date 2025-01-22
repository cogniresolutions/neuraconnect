import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AZURE_OPENAI_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT");
const AZURE_OPENAI_KEY = Deno.env.get("AZURE_OPENAI_KEY");

serve(async (req) => {
  try {
    const { message } = await req.json();

    const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY!,
      },
      body: JSON.stringify({
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

    const data = await response.json();

    return new Response(
      JSON.stringify({ response: data.choices[0].message.content }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});