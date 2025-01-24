import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personaId, config } = await req.json();
    console.log('Validating Azure services for persona:', personaId);

    // Validate Azure Speech Services first
    try {
      console.log('Testing Azure Speech Services connection...');
      const speechEndpoint = Deno.env.get('AZURE_SPEECH_ENDPOINT');
      const speechKey = Deno.env.get('AZURE_SPEECH_KEY');

      if (!speechEndpoint || !speechKey) {
        console.error('Missing Azure Speech credentials');
        throw new Error('Azure Speech credentials not configured');
      }

      // Test with a more reliable endpoint
      const testUrl = `${speechEndpoint}/cognitiveservices/voices/list`;
      console.log('Making request to:', testUrl);

      const speechResponse = await fetch(testUrl, {
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
        },
      });

      if (!speechResponse.ok) {
        const error = await speechResponse.text();
        console.error('Speech Services validation failed:', error);
        throw new Error(`Failed to validate Azure Speech Services: ${error}`);
      }

      console.log('Azure Speech Services validated successfully');
    } catch (error) {
      console.error('Error validating Azure Speech Services:', error);
      throw new Error(`Failed to validate Azure Speech Services: ${error.message}`);
    }

    // Then validate Azure OpenAI
    try {
      console.log('Testing Azure OpenAI connection...');
      const openaiEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');
      const openaiKey = Deno.env.get('AZURE_OPENAI_API_KEY');

      if (!openaiEndpoint || !openaiKey) {
        console.error('Missing Azure OpenAI credentials');
        throw new Error('Azure OpenAI credentials not configured');
      }

      const deploymentName = 'gpt-4o-mini';
      const apiVersion = '2024-02-15-preview';
      
      const deploymentResponse = await fetch(
        `${openaiEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
        {
          method: 'POST',
          headers: {
            'api-key': openaiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'system', content: 'Test connection' }],
            max_tokens: 5,
          }),
        }
      );

      if (!deploymentResponse.ok) {
        const error = await deploymentResponse.text();
        console.error('OpenAI validation failed:', error);
        throw new Error(`Failed to validate Azure OpenAI deployment: ${error}`);
      }

      console.log('Azure OpenAI validated successfully');
    } catch (error) {
      console.error('Error validating Azure OpenAI:', error);
      throw new Error(`Failed to validate Azure OpenAI: ${error.message}`);
    }

    // If all validations pass, generate the token
    console.log('All Azure services validated successfully');
    const token = btoa(`${Deno.env.get('AZURE_OPENAI_ENDPOINT')}:${Deno.env.get('AZURE_OPENAI_API_KEY')}`);

    return new Response(
      JSON.stringify({
        token,
        personaId,
        config,
        timestamp: new Date().toISOString(),
        status: 'success',
        services: {
          openai: true,
          speech: true
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in generate-chat-token:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});