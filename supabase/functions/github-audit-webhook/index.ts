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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process PUSH events with real-time AI analysis
    if (githubEvent === 'push') {
      console.log('🚀 Processing PUSH event with OpenAI analysis...');
      
      const repository = payload.repository;
      const commits = payload.commits || [];
      const headCommit = payload.head_commit;

      if (!openaiApiKey) {
        console.error('❌ OPENAI_API_KEY not configured');
        return new Response(JSON.stringify({ error: 'OpenAI not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create audit log entry
      const { data: auditLog, error: auditError } = await supabase
        .from('github_audit_logs')
        .insert({
          event_type: githubEvent,
          repository: repository.full_name,
          workflow_name: 'push-event',
          branch: payload.ref?.replace('refs/heads/', ''),
          commit_sha: headCommit?.id,
          commit_message: headCommit?.message,
          status: 'processing',
          audit_data: {
            commits_count: commits.length,
            pusher: payload.pusher,
            head_commit: headCommit
          }
        })
        .select()
        .single();

      if (auditError) {
        console.error('❌ Failed to create audit log:', auditError);
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`✅ Audit log created: ${auditLog.id}`);

      // Prepare code context for analysis
      const filesChanged = commits.flatMap((c: any) => [
        ...(c.added || []),
        ...(c.modified || [])
      ]).filter((f: any, i: number, arr: any[]) => arr.indexOf(f) === i); // unique files

      // Download actual file contents from GitHub
      const fileContents: any[] = [];
      const repoOwner = repository.owner.login;
      const repoName = repository.name;
      const branch = payload.ref?.replace('refs/heads/', '');
      
      console.log(`📥 Descargando contenido de ${filesChanged.length} archivos...`);
      
      for (const filePath of filesChanged.slice(0, 10)) { // Limit to 10 files to avoid timeout
        try {
          const githubUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`;
          console.log(`⬇️ Descargando: ${filePath}`);
          
          const response = await fetch(githubUrl, {
            headers: {
              'Accept': 'application/vnd.github.v3.raw',
              'User-Agent': 'Supabase-Edge-Function'
            }
          });
          
          if (response.ok) {
            const content = await response.text();
            fileContents.push({
              path: filePath,
              content: content.slice(0, 3000) // Limit to first 3000 chars per file
            });
            console.log(`✅ Descargado: ${filePath} (${content.length} chars)`);
          } else {
            console.log(`⚠️ No se pudo descargar: ${filePath} (${response.status})`);
          }
        } catch (error) {
          console.error(`❌ Error descargando ${filePath}:`, error);
        }
      }

      const codeContext = {
        repository: repository.full_name,
        branch: branch,
        commit: headCommit?.id,
        message: headCommit?.message,
        author: headCommit?.author?.name,
        files_changed: filesChanged,
        file_contents: fileContents,
        commits_summary: commits.map((c: any) => ({
          message: c.message,
          author: c.author?.name,
          files: [...(c.added || []), ...(c.modified || [])]
        }))
      };

      console.log(`📊 Contexto preparado con ${fileContents.length} archivos descargados`);

      // Call OpenAI for analysis
      try {
        // Build detailed file contents for analysis
        const fileDetails = codeContext.file_contents.map((f: any) => 
          `### Archivo: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
        ).join('\n\n');

        const analysisPrompt = `Eres un auditor de código experto especializado en React, TypeScript y Supabase. Analiza el código REAL proporcionado y genera correcciones específicas.

**Contexto del Commit:**
- Repositorio: ${codeContext.repository}
- Branch: ${codeContext.branch}
- Autor: ${codeContext.author}
- Mensaje: ${codeContext.message}

**Código Real de los Archivos Modificados:**
${fileDetails || 'No se pudo descargar el contenido de los archivos'}

**Instrucciones CRÍTICAS:**
1. Analiza ÚNICAMENTE el código real proporcionado arriba
2. NO inventes ejemplos ni archivos que no existen
3. Si no hay código para analizar, devuelve un array vacío de correcciones
4. Identifica problemas de:
   - Seguridad (XSS, SQL injection, autenticación)
   - Rendimiento (re-renders innecesarios, memory leaks)
   - Accesibilidad (ARIA labels, contraste)
   - Calidad de código (tipos TypeScript, manejo de errores)

**Formato de Respuesta (JSON válido):**
{
  "corrections": [
    {
      "severity": "critical" | "important" | "suggestion",
      "file_path": "ruta/exacta/del/archivo.tsx",
      "line_number": número_de_línea,
      "issue_title": "Título específico del problema",
      "issue_description": "Descripción detallada del problema y su impacto",
      "code_before": "código problemático exacto del archivo",
      "code_after": "código corregido sugerido"
    }
  ]
}

**SI NO HAY CÓDIGO PARA ANALIZAR, responde:** { "corrections": [] }`;

        console.log('🤖 Calling OpenAI GPT-4o-mini for analysis...');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'Eres un auditor de código senior especializado en React, TypeScript y Supabase. Analizas ÚNICAMENTE el código proporcionado. NUNCA inventes ejemplos. Respondes solo en formato JSON válido. Si no hay código, devuelves {"corrections": []}.'
              },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          }),
        });

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          console.error('❌ OpenAI error:', openaiResponse.status, errorText);
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const aiResponse = openaiData.choices?.[0]?.message?.content;
        
        console.log('🤖 OpenAI response received:', aiResponse?.substring(0, 200));

        // Parse AI response
        let aiAnalysis;
        try {
          // Clean response if it has markdown code blocks
          const cleanedResponse = aiResponse
            ?.replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          aiAnalysis = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          aiAnalysis = { corrections: [] };
        }

        const corrections = aiAnalysis.corrections || [];
        console.log(`📝 Found ${corrections.length} corrections`);

        // Save corrections to database
        if (corrections.length > 0) {
          const correctionsToInsert = corrections.map((c: any) => ({
            audit_log_id: auditLog.id,
            severity: c.severity,
            file_path: c.file_path,
            line_number: c.line_number,
            issue_title: c.issue_title,
            issue_description: c.issue_description,
            code_before: c.code_before,
            code_after: c.code_after,
            status: 'pending'
          }));

          const { error: correctionsError } = await supabase
            .from('ai_corrections')
            .insert(correctionsToInsert);

          if (correctionsError) {
            console.error('❌ Failed to insert corrections:', correctionsError);
          } else {
            console.log(`✅ ${corrections.length} corrections saved to database`);
          }
        }

        // Update audit log with analysis
        await supabase
          .from('github_audit_logs')
          .update({
            status: 'completed',
            ai_analysis: {
              agent: 'OpenAI GPT-4o-mini',
              timestamp: new Date().toISOString(),
              analysis: aiAnalysis
            },
            findings_summary: {
              total_corrections: corrections.length,
              by_severity: {
                critical: corrections.filter((c: any) => c.severity === 'critical').length,
                important: corrections.filter((c: any) => c.severity === 'important').length,
                suggestion: corrections.filter((c: any) => c.severity === 'suggestion').length
              }
            }
          })
          .eq('id', auditLog.id);

        console.log('✅ Push event processed successfully');

        return new Response(JSON.stringify({ 
          success: true,
          audit_log_id: auditLog.id,
          corrections_found: corrections.length
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (analysisError) {
        console.error('❌ Analysis error:', analysisError);
        
        // Update audit log with error
        await supabase
          .from('github_audit_logs')
          .update({
            status: 'failed',
            ai_analysis: {
              error: analysisError instanceof Error ? analysisError.message : 'Unknown error'
            }
          })
          .eq('id', auditLog.id);

        return new Response(JSON.stringify({ 
          error: 'Analysis failed',
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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

      // Combine all corrections from both agents
      const allCorrections = [...securityCorrections, ...uxCorrections];
      console.log(`📝 Total corrections: ${allCorrections.length} (${securityCorrections.length} security + ${uxCorrections.length} UX)`);

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

      // Insert AI corrections from BOTH agents
      if (allCorrections.length > 0) {
        const corrections = allCorrections.map((correction: any) => {
          // Determine source agent
          const isUX = uxCorrections.includes(correction);
          const agent = isUX ? 'Ultra UX Bot v2.0' : 'WINCOVA Security Auditor v2.0';
          
          return {
            audit_log_id: data.id,
            severity: (correction.severity?.toLowerCase() || 'suggestion') as string,
            file_path: correction.file || correction.file_path || 'unknown',
            line_number: correction.line || correction.line_number || null,
            issue_title: `[${agent}] ${correction.title || correction.issue_title || 'AI Suggestion'}`,
            issue_description: `${correction.description || correction.issue_description || ''}\n\n**Categoría:** ${correction.category || 'general'}\n**Impacto:** ${correction.impact || 'No especificado'}\n\n${correction.references?.length ? `**Referencias:**\n${correction.references.map((ref: string) => `- ${ref}`).join('\n')}` : ''}`,
            code_before: correction.code_before || null,
            code_after: correction.code_after || null,
            status: 'pending',
            admin_notes: isUX && correction.roi_calculation 
              ? `ROI: $${correction.roi_calculation.daily_revenue_at_risk}/day at risk`
              : null
          };
        });

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
          ai_corrections_count: allCorrections.length,
          security_corrections: securityCorrections.length,
          ux_corrections: uxCorrections.length,
          combined_risk: combinedSummary.combined_risk_level,
          message: 'Dual agent audit log saved successfully' 
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