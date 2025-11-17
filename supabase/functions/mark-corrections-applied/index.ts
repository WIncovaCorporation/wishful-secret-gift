import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { correction_ids } = await req.json();

    if (!Array.isArray(correction_ids) || correction_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'correction_ids must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Marcar correcciones como aplicadas
    const { data, error } = await supabase
      .from('ai_corrections')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString()
      })
      .in('id', correction_ids)
      .select('id, file_path, issue_title');

    if (error) {
      console.error('Error updating corrections:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to mark corrections as applied' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Marked ${data?.length || 0} corrections as applied`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        applied_count: data?.length || 0,
        corrections: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
