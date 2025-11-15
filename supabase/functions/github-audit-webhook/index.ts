import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-github-event, x-hub-signature-256',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 GitHub webhook received');

    // Validate GitHub signature (optional if secret not configured)
    const signature = req.headers.get('x-hub-signature-256');
    const githubEvent = req.headers.get('x-github-event');
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // Verify signature only if secret is configured
    const secret = Deno.env.get('GITHUB_WEBHOOK_SECRET');
    if (secret && secret.trim() !== '') {
      if (!signature) {
        console.error('❌ Missing GitHub signature');
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(rawBody)
      );

      const computedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (computedSignature !== signature) {
        console.error('❌ Invalid signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Signature verified');
    } else {
      console.log('⚠️ No webhook secret configured - skipping signature validation');
    }
    console.log('📦 Event type:', githubEvent);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process workflow_run events (auditoría completada)
    if (githubEvent === 'workflow_run') {
      const workflowRun = payload.workflow_run;
      const repository = payload.repository;

      // Extract audit data
      const auditLog = {
        repository: repository.full_name,
        branch: workflowRun.head_branch,
        commit_sha: workflowRun.head_sha,
        commit_message: workflowRun.head_commit?.message || '',
        workflow_name: workflowRun.name,
        workflow_run_id: workflowRun.id.toString(),
        event_type: workflowRun.event,
        status: workflowRun.conclusion || workflowRun.status,
        audit_data: {
          workflow_url: workflowRun.html_url,
          run_number: workflowRun.run_number,
          run_attempt: workflowRun.run_attempt,
          triggered_by: workflowRun.triggering_actor?.login || 'unknown',
          created_at: workflowRun.created_at,
          updated_at: workflowRun.updated_at,
          repository_url: repository.html_url,
          full_payload: payload
        },
        findings_summary: null // Se puede agregar lógica para parsear findings
      };

      // Insert into database
      const { data, error } = await supabase
        .from('github_audit_logs')
        .insert([auditLog])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Database error', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Audit log saved:', data.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          log_id: data.id,
          message: 'Audit log saved successfully' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process check_run events (resultados de checks individuales)
    if (githubEvent === 'check_run') {
      const checkRun = payload.check_run;
      const repository = payload.repository;

      const auditLog = {
        repository: repository.full_name,
        branch: checkRun.check_suite?.head_branch || 'unknown',
        commit_sha: checkRun.head_sha,
        commit_message: '',
        workflow_name: checkRun.name,
        workflow_run_id: checkRun.id.toString(),
        event_type: 'check_run',
        status: checkRun.conclusion || checkRun.status,
        audit_data: {
          check_url: checkRun.html_url,
          output: checkRun.output,
          started_at: checkRun.started_at,
          completed_at: checkRun.completed_at,
          full_payload: payload
        },
        findings_summary: checkRun.output?.annotations || null
      };

      const { data, error } = await supabase
        .from('github_audit_logs')
        .insert([auditLog])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Database error', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Check run log saved:', data.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          log_id: data.id,
          message: 'Check run log saved successfully' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For other events, just acknowledge receipt
    console.log('ℹ️ Event type not processed:', githubEvent);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Event ${githubEvent} received but not processed` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});