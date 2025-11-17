import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Correction {
  id: string;
  file_path: string;
  line_number: number | null;
  issue_title: string;
  issue_description: string;
  severity: string;
  code_before: string | null;
  code_after: string | null;
  admin_notes: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener correcciones aprobadas pero no aplicadas
    const { data: corrections, error } = await supabase
      .from('ai_corrections')
      .select('id, file_path, line_number, issue_title, issue_description, severity, code_before, code_after, admin_notes')
      .eq('status', 'approved')
      .order('severity', { ascending: false }) // Críticas primero
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching corrections:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch corrections' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Formatear para consumo de agentes AI
    const formattedCorrections = {
      total_corrections: corrections?.length || 0,
      instructions_for_ai: `
You are an AI agent tasked with applying code corrections to a codebase.

INSTRUCTIONS:
1. Read each correction below carefully
2. Locate the file specified in 'file_path'
3. If 'line_number' is provided, navigate to that line
4. Replace 'code_before' with 'code_after'
5. Verify the change makes sense in context
6. After applying ALL corrections, mark them as applied by calling the update endpoint

IMPORTANT:
- Apply corrections in order (critical first)
- If a correction cannot be applied, skip it and note why
- Preserve code formatting and indentation
- Test that the code still works after changes
`,
      corrections: corrections?.map((c: Correction) => ({
        correction_id: c.id,
        severity: c.severity,
        file: c.file_path,
        line: c.line_number,
        issue: c.issue_title,
        description: c.issue_description,
        current_code: c.code_before,
        suggested_code: c.code_after,
        notes: c.admin_notes,
        action_required: `Replace the code at line ${c.line_number || 'unknown'} in ${c.file_path}`,
      })) || []
    };

    console.log(`Returning ${corrections?.length || 0} approved corrections`);

    return new Response(
      JSON.stringify(formattedCorrections, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
