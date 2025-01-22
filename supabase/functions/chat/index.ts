import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  try {
    const { message } = await req.json();

    const configuration = new Configuration({
      apiKey: OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
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
    });

    return new Response(
      JSON.stringify({ response: completion.data.choices[0].message?.content }),
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