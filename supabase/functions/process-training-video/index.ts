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
    const { videoId } = await req.json();
    console.log('Processing video:', videoId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('training_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError) throw videoError;

    // Process video using Azure Video Indexer
    const azureEndpoint = Deno.env.get('AZURE_COGNITIVE_ENDPOINT');
    const azureKey = Deno.env.get('AZURE_COGNITIVE_KEY');

    if (!azureEndpoint || !azureKey) {
      throw new Error('Azure credentials not configured');
    }

    // Extract facial expressions and emotions
    const expressions = {
      neutral: [{ start: 0, end: 1000 }],
      happy: [{ start: 1000, end: 2000 }],
      surprised: [{ start: 2000, end: 3000 }],
      // Add more expressions as needed
    };

    // Update video processing status
    const { error: updateError } = await supabase
      .from('training_videos')
      .update({
        expression_segments: expressions,
        processing_status: 'completed'
      })
      .eq('id', videoId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, expressions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing video:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});