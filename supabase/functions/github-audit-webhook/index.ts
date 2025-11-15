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

    const githubEvent = req.headers.get('x-github-event');
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    console.log('⚠️ Webhook sin validación de firma - solo para desarrollo/testing');
    console.log('📦 Event type:', githubEvent);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process workflow_run events (auditoría completada)
    if (githubEvent === 'workflow_run') {
      const workflowRun = payload.workflow_run;
      const repository = payload.repository;

      // Parse DUAL AGENT analysis (Security + UX)
      let securityAnalysis = null;
      let uxAnalysis = null;
      let securityCorrections = [];
      let uxCorrections = [];
      let combinedSummary = {
        security: { critical_count: 0, important_count: 0, suggestion_count: 0, overall_risk: 'unknown' },
        ux: { critical_count: 0, important_count: 0, suggestion_count: 0, ux_score: 0, revenue_at_risk_daily: 0 },
        combined_risk_level: 'unknown'
      };
      
      // Process WINCOVA Security Auditor v2.0 analysis
      if (workflowRun.security_analysis) {
        try {
          const securityAnalysisStr = typeof workflowRun.security_analysis === 'string' 
            ? workflowRun.security_analysis 
            : JSON.stringify(workflowRun.security_analysis);
          
          console.log('🔐 Processing WINCOVA Security Auditor v2.0...');
          securityAnalysis = JSON.parse(securityAnalysisStr);
          
          if (securityAnalysis.agent && securityAnalysis.agent.includes('WINCOVA')) {
            console.log(`✅ Security Agent: ${securityAnalysis.agent}`);
            combinedSummary.security = securityAnalysis.summary || combinedSummary.security;
            securityCorrections = securityAnalysis.corrections || [];
            console.log(`🔐 Security: ${combinedSummary.security.critical_count} critical, ${securityCorrections.length} total`);
          }
        } catch (e) {
          console.error('⚠️ Failed to parse security analysis:', e);
          securityAnalysis = { error: true, parse_error: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      // Process Ultra UX Bot v2.0 analysis
      if (workflowRun.ux_analysis) {
        try {
          const uxAnalysisStr = typeof workflowRun.ux_analysis === 'string' 
            ? workflowRun.ux_analysis 
            : JSON.stringify(workflowRun.ux_analysis);
          
          console.log('🎨 Processing Ultra UX & Frontline Validation Bot v2.0...');
          uxAnalysis = JSON.parse(uxAnalysisStr);
          
          if (uxAnalysis.agent && uxAnalysis.agent.includes('Ultra UX')) {
            console.log(`✅ UX Agent: ${uxAnalysis.agent}`);
            combinedSummary.ux = {
              critical_count: uxAnalysis.summary?.critical_count || 0,
              important_count: uxAnalysis.summary?.important_count || 0,
              suggestion_count: uxAnalysis.summary?.suggestion_count || 0,
              ux_score: uxAnalysis.summary?.overall_ux_score || 0,
              revenue_at_risk_daily: uxAnalysis.summary?.revenue_at_risk_daily || 0
            };
            uxCorrections = uxAnalysis.corrections || [];
            console.log(`🎨 UX: ${combinedSummary.ux.critical_count} critical, $${combinedSummary.ux.revenue_at_risk_daily}/day at risk`);
          }
        } catch (e) {
          console.error('⚠️ Failed to parse UX analysis:', e);
          uxAnalysis = { error: true, parse_error: e instanceof Error ? e.message : 'Unknown error' };
        }
      }

      // Calculate combined risk level
      const totalCritical = combinedSummary.security.critical_count + combinedSummary.ux.critical_count;
      const totalImportant = combinedSummary.security.important_count + combinedSummary.ux.important_count;
      
      if (totalCritical > 0) {
        combinedSummary.combined_risk_level = 'high';
      } else if (totalImportant > 2) {
        combinedSummary.combined_risk_level = 'medium';
      } else {
        combinedSummary.combined_risk_level = 'low';
      }

      console.log(`📊 COMBINED SUMMARY:`);
      console.log(`   🔐 Security: ${combinedSummary.security.critical_count}C/${combinedSummary.security.important_count}I`);
      console.log(`   🎨 UX: ${combinedSummary.ux.critical_count}C/${combinedSummary.ux.important_count}I ($${combinedSummary.ux.revenue_at_risk_daily}/day)`);
      console.log(`   ⚠️ Combined Risk: ${combinedSummary.combined_risk_level.toUpperCase()}`);

      // Extract audit data with DUAL AGENT analysis
      const auditLog = {
        repository: repository.full_name,
        branch: workflowRun.head_branch,
        commit_sha: workflowRun.head_sha,
        commit_message: workflowRun.head_commit?.message || '',
        workflow_name: workflowRun.name,
        workflow_run_id: workflowRun.id.toString(),
        event_type: workflowRun.event,
        status: workflowRun.conclusion || workflowRun.status,
        ai_analysis: {
          security: securityAnalysis,
          ux: uxAnalysis,
          combined_summary: combinedSummary
        },
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
        findings_summary: null
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

      // Insert AI corrections if available
      if (parsedCorrections && parsedCorrections.length > 0) {
        const corrections = parsedCorrections.map((correction: any) => ({
          audit_log_id: data.id,
          severity: (correction.severity?.toLowerCase() || 'suggestion') as string,
          file_path: correction.file || 'unknown',
          line_number: correction.line || null,
          issue_title: correction.title || 'AI Suggestion',
          issue_description: `${correction.description || ''}\n\n**Categoría:** ${correction.category || 'general'}\n**Impacto:** ${correction.impact || 'No especificado'}\n\n${correction.references?.length ? `**Referencias:**\n${correction.references.map((ref: string) => `- ${ref}`).join('\n')}` : ''}`,
          code_before: correction.code_before || null,
          code_after: correction.code_after || null,
          status: 'pending'
        }));

        const { data: correctionsData, error: correctionsError } = await supabase
          .from('ai_corrections')
          .insert(corrections)
          .select();

        if (correctionsError) {
          console.error('⚠️ Failed to save AI corrections:', correctionsError);
        } else {
          console.log(`✅ Saved ${correctionsData.length} AI corrections`);
          
          // Log breakdown by severity
          const criticalCount = correctionsData.filter((c: any) => c.severity === 'critical').length;
          const importantCount = correctionsData.filter((c: any) => c.severity === 'important').length;
          const suggestionCount = correctionsData.filter((c: any) => c.severity === 'suggestion').length;
          
          console.log(`   🔴 Critical: ${criticalCount}`);
          console.log(`   🟡 Important: ${importantCount}`);
          console.log(`   🟢 Suggestions: ${suggestionCount}`);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          log_id: data.id,
          ai_corrections_count: parsedCorrections?.length || 0,
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