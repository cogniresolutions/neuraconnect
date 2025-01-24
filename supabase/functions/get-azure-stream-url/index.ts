import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const azureEndpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    if (!azureEndpoint) {
      throw new Error('Azure OpenAI endpoint not configured');
    }

    // Extract the container app URL from the Azure endpoint
    const containerUrl = azureEndpoint.replace('openai.azure.com', 'azurecontainerapps.io');
    const streamUrl = `${containerUrl}/video`;

    return new Response(
      JSON.stringify({ 
        url: streamUrl,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in get-azure-stream-url function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})