import { corsHeaders } from '../_shared/cors.ts';

const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { personaId, config } = await req.json();

    if (!personaId) {
      throw new Error('Persona ID is required');
    }

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    console.log('Generating chat completion for persona:', personaId);

    // Constructing the Azure OpenAI API URL with the correct endpoint and API version
    const apiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2023-12-01-preview`;
    console.log('Requesting completion from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are ${config?.name || 'an AI assistant'}, with the following personality: ${config?.personality || 'helpful and friendly'}. ${config?.skills ? `You have expertise in: ${JSON.stringify(config.skills)}.` : ''} ${config?.topics ? `You should focus on discussing topics related to: ${config.topics.join(', ')}.` : ''}`,
          },
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        temperature: config?.temperature || 0.7,
        max_tokens: config?.max_tokens || 800,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat completion failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to generate chat completion: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully generated chat completion');

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});