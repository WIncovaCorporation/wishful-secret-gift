# Configuración de Webhooks de GitHub para Auditorías Automáticas

Este documento explica cómo configurar GitHub Actions para enviar informes de auditoría automáticamente a tu aplicación.

## 🎯 Resumen

Tu aplicación ahora puede recibir informes de auditoría desde GitHub Actions en tiempo real. Cada vez que se ejecute un workflow en tu repositorio, se guardará automáticamente en la base de datos y podrás verlo en el dashboard de admin.

## 📋 Requisitos Previos

1. ✅ Tabla `github_audit_logs` creada en la base de datos
2. ✅ Edge Function `github-audit-webhook` desplegada
3. ✅ Secret `GITHUB_WEBHOOK_SECRET` configurado
4. ✅ Dashboard de admin accesible en `/admin/audit-logs`

## 🔧 Configuración en GitHub

### Paso 1: Obtener la URL del Webhook

Tu URL del webhook es:
```
https://ghbksqyioendvispcseu.supabase.co/functions/v1/github-audit-webhook
```

### Paso 2: Configurar el Webhook en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Webhooks** → **Add webhook**
3. Configura los siguientes valores:

   - **Payload URL**: `https://ghbksqyioendvispcseu.supabase.co/functions/v1/github-audit-webhook`
   - **Content type**: `application/json`
   - **Secret**: El mismo valor que configuraste en `GITHUB_WEBHOOK_SECRET`
   - **Which events would you like to trigger this webhook?**
     - Selecciona "Let me select individual events"
     - Marca estas opciones:
       - ✅ **Workflow runs** (recomendado)
       - ✅ **Check runs** (opcional, para detalles de checks)
       - ✅ **Workflow jobs** (opcional)

4. Marca **Active**
5. Click en **Add webhook**

### Paso 3: Verificar la Configuración

GitHub enviará un evento de prueba. Verifica que:
- El webhook aparece con un ✅ verde en GitHub
- No hay errores en los "Recent Deliveries"

## 📊 Dashboard de Auditorías

### Acceso

Solo los usuarios con rol **admin** pueden acceder al dashboard:
- URL: `/admin/audit-logs`
- Acceso desde: Menú de perfil → "Auditorías GitHub"

### Características

- 📋 **Vista de todos los logs**: workflows, checks, y eventos
- 🔍 **Filtros**: Todos, Exitosos, Fallidos, Pendientes
- 🔗 **Links directos**: Click para ver el workflow en GitHub
- 🗑️ **Gestión**: Elimina logs antiguos
- 🔄 **Auto-actualización**: Botón de refresh manual

### Información mostrada

Cada log de auditoría muestra:
- ✅ Estado del workflow (success/failure/pending)
- 📦 Nombre del workflow
- 🌿 Branch y commit
- 📝 Mensaje del commit
- 🔗 Link al workflow en GitHub
- ⏰ Timestamp de recepción

## 🔐 Seguridad

### Validación de Firma

El webhook valida automáticamente cada request usando HMAC-SHA256:
- GitHub firma cada payload con tu secret
- La edge function verifica la firma antes de procesar
- Requests sin firma válida son rechazados (401)

### Control de Acceso

- **Edge Function**: Pública pero validada con signature
- **Base de datos**: RLS habilitado, solo admins leen/eliminan
- **Dashboard**: Protegido por rol, redirección automática

## 📝 Workflow Completo de Auditoría WINCOVA

El proyecto incluye un workflow completo y automatizado en `.github/workflows/wincova-audit.yml` que ejecuta:

✅ **Code Quality Analysis** - ESLint & TypeScript checks  
✅ **Automated Testing** - Suite completa de tests con coverage  
✅ **Security Scanning** - npm audit & detección de secrets  
✅ **Build Verification** - Validación de build de producción  
✅ **Automatic Reporting** - Envío automático de resultados al dashboard  

### 🚀 Setup Rápido

**1. Copia el workflow a tu repositorio:**
```bash
mkdir -p .github/workflows
cp .github/workflows/wincova-audit.yml .github/workflows/
git add .github/workflows/wincova-audit.yml
git commit -m "Add WINCOVA automated audit workflow"
git push
```

**2. Configura GitHub Secrets** en tu repositorio (Settings → Secrets → Actions):
- `WINCOVA_WEBHOOK_URL` - **REQUERIDO**: `https://ghbksqyioendvispcseu.supabase.co/functions/v1/github-audit-webhook`
- `VITE_SUPABASE_URL` - Opcional (para verificación de build)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Opcional (para verificación de build)
- `VITE_SUPABASE_PROJECT_ID` - Opcional (para verificación de build)

**3. El workflow se activará automáticamente en:**
- Push a `main` o `develop`
- Pull requests a `main` o `develop`
- Ejecución manual desde el tab Actions

### 📋 Ejemplo de Workflow Simple

Si prefieres un workflow más básico:

```yaml
# .github/workflows/simple-audit.yml
name: Simple Audit

on:
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install & Test
        run: |
          npm ci
          npm test
      
      - name: Report to Webhook
        if: always()
        run: |
          curl -X POST "${{ secrets.WINCOVA_WEBHOOK_URL }}" \
            -H "Content-Type: application/json" \
            -H "X-GitHub-Event: workflow_run" \
            -d '{
              "workflow_run": {
                "name": "${{ github.workflow }}",
                "status": "completed",
                "conclusion": "${{ job.status }}",
                "html_url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
              },
              "repository": {
                "full_name": "${{ github.repository }}"
              }
            }'
```

## 🧪 Pruebas

### Probar el Webhook Manualmente

Usa `curl` para enviar un payload de prueba:

```bash
curl -X POST https://ghbksqyioendvispcseu.supabase.co/functions/v1/github-audit-webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: workflow_run" \
  -H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE" \
  -d '{
    "workflow_run": {
      "name": "Test Audit",
      "head_branch": "main",
      "head_sha": "abc123",
      "event": "push",
      "status": "completed",
      "conclusion": "success"
    },
    "repository": {
      "full_name": "user/repo"
    }
  }'
```

### Verificar Logs

1. Ve a `/admin/audit-logs` en tu aplicación
2. Deberías ver el log de prueba
3. Verifica que todos los campos se muestran correctamente

## 🐛 Troubleshooting

### El webhook no recibe eventos

1. Verifica que el webhook esté **Active** en GitHub
2. Revisa "Recent Deliveries" en GitHub para ver errores
3. Verifica que la URL del webhook sea correcta
4. Confirma que el secret coincide

### Los logs no aparecen en el dashboard

1. Verifica que tienes rol de **admin**
2. Revisa los logs de la edge function en Lovable Cloud
3. Confirma que la tabla `github_audit_logs` existe
4. Verifica las políticas RLS

### Error 401 (Unauthorized)

- El secret no coincide
- Verifica `GITHUB_WEBHOOK_SECRET` en Lovable Cloud
- Actualiza el secret en GitHub Settings → Webhooks

### Error 500 (Internal Server Error)

- Revisa los logs de la edge function
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado
- Confirma que la tabla existe y tiene las columnas correctas

## 📚 Recursos

- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Securing Webhooks](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)

## 🎉 ¡Listo!

Ahora cada vez que se ejecute un workflow en tu repositorio:
1. 🚀 GitHub enviará el evento automáticamente
2. ✅ La edge function lo procesará y validará
3. 💾 Se guardará en la base de datos
4. 📊 Lo verás en tiempo real en `/admin/audit-logs`

**Sin necesidad de salir de tu aplicación** 🎯