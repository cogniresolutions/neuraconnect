import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        // Request completion from OpenAI
        const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: message.systemPrompt || "You are a helpful AI assistant." },
              { role: "user", content: message.text }
            ],
            stream: true,
          }),
        });

        if (!openAIResponse.ok) {
          throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
        }

        const reader = openAIResponse.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get response reader");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          socket.send(JSON.stringify({ type: "chunk", data: chunk }));
        }

        socket.send(JSON.stringify({ type: "done" }));
      } catch (error) {
        console.error("Error processing message:", error);
        socket.send(JSON.stringify({ 
          type: "error", 
          error: error instanceof Error ? error.message : "Unknown error" 
        }));
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return response;
  } catch (error) {
    console.error("Error setting up WebSocket:", error);
    return new Response(JSON.stringify({ error: "Failed to setup WebSocket connection" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});