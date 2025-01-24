import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
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
    const { personaId, filePath, fileType } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('training_materials')
      .download(filePath);

    if (downloadError) throw downloadError;

    // Convert file to text based on type
    let textContent = '';
    if (fileType.includes('text/')) {
      textContent = await fileData.text();
    } else {
      // For binary files, we'd need to use specific parsers
      // This is a simplified example
      textContent = await fileData.text();
    }

    // Process with Azure OpenAI
    const response = await fetch(`${Deno.env.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': Deno.env.get('AZURE_OPENAI_API_KEY') ?? '',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes training materials and extracts key information.'
          },
          {
            role: 'user',
            content: `Analyze this content and extract key information: ${textContent}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.statusText}`);
    }

    const analysisResult = await response.json();

    // Update training material with analysis results
    const { error: updateError } = await supabase
      .from('persona_training_materials')
      .update({
        analysis_results: analysisResult,
        status: 'processed'
      })
      .eq('file_path', filePath);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: 'Training material processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing training material:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});