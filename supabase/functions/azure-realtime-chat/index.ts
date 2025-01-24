import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AZURE_OPENAI_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY');
    const AZURE_SPEECH_ENDPOINT = Deno.env.get('AZURE_SPEECH_ENDPOINT');

    if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_SPEECH_KEY || !AZURE_SPEECH_ENDPOINT) {
      console.error('Missing required Azure credentials:', {
        hasOpenAIKey: !!AZURE_OPENAI_KEY,
        hasOpenAIEndpoint: !!AZURE_OPENAI_ENDPOINT,
        hasSpeechKey: !!AZURE_SPEECH_KEY,
        hasSpeechEndpoint: !!AZURE_SPEECH_ENDPOINT
      });
      throw new Error('Azure credentials are not configured');
    }

    const { persona } = await req.json();
    console.log('Received request for persona:', {
      id: persona.id,
      name: persona.name,
      voice_style: persona.voice_style
    });

    if (!persona || !persona.id || !persona.voice_style) {
      throw new Error('Invalid persona data provided');
    }

    // Map voice style to Azure voices
    const voiceMapping: { [key: string]: string } = {
      'en-US-JennyNeural': 'shimmer',
      'en-US-GuyNeural': 'echo',
      'en-US-AriaNeural': 'shimmer',
      'en-US-DavisNeural': 'echo'
    };

    const mappedVoice = voiceMapping[persona.voice_style] || 'alloy';
    console.log('Mapped voice style:', persona.voice_style, 'to:', mappedVoice);

    // Request a token from Azure OpenAI
    const tokenUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o-mini/chat/realtime/token?api-version=2024-12-17`;
    console.log('Requesting token from:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "api-key": AZURE_OPENAI_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice: mappedVoice,
        instructions: `You are ${persona.name}, an AI assistant with the following personality: ${persona.personality || 'helpful and friendly'}. 
                      ${persona.skills ? `You have expertise in: ${JSON.stringify(persona.skills)}.` : ''} 
                      ${persona.topics ? `You should focus on discussing topics related to: ${persona.topics.join(', ')}.` : ''}
                      Always maintain the persona's character and personality throughout the conversation.`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint: AZURE_OPENAI_ENDPOINT
      });
      throw new Error(`Azure OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Successfully obtained token and endpoint");

    // Initialize Azure Speech service configuration
    const speechConfig = {
      endpoint: AZURE_SPEECH_ENDPOINT,
      key: AZURE_SPEECH_KEY,
      voice: persona.voice_style,
      language: 'en-US'
    };

    return new Response(JSON.stringify({
      token: data.token,
      endpoint: data.endpoint,
      speechConfig
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in azure-realtime-chat function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});