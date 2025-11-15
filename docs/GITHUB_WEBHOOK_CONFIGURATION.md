# 🔗 Configuración del Webhook de GitHub para WINCOVA Audit

## 📋 Resumen

Este documento explica cómo configurar el webhook de GitHub para que el sistema de auditoría dual (WINCOVA Security Auditor + Ultra UX Bot) envíe los resultados automáticamente a tu dashboard de GiftApp.

---

## 🎯 ¿Qué hace este webhook?

Cuando haces cambios en el código y los subes a GitHub:

1. **GitHub Actions ejecuta el workflow** de auditoría (`wincova-audit.yml`)
2. **Los agentes de IA analizan tu código**:
   - 🔐 **WINCOVA Security Auditor v2.0**: Busca vulnerabilidades de seguridad, problemas de performance y calidad de código
   - 🎨 **Ultra UX Bot v2.0**: Analiza UX, accesibilidad, y calcula revenue at risk
3. **El workflow envía los resultados** al webhook de Supabase
4. **El webhook procesa y guarda** los resultados en la base de datos
5. **Puedes ver las correcciones** en `/admin/corrections`

---

## ⚙️ Configuración Paso a Paso

### Paso 1: Obtener la URL del Webhook

Tu URL del webhook de Supabase es:

```
https://ghbksqyioendvispcseu.supabase.co/functions/v1/github-audit-webhook
```

📋 **Copia esta URL**, la necesitarás en el siguiente paso.

---

### Paso 2: Configurar el Secreto en GitHub

1. **Ve a tu repositorio en GitHub**
   - URL: `https://github.com/[TU-USUARIO]/[TU-REPO]`

2. **Navega a Settings > Secrets and variables > Actions**
   - Ruta: `Settings` → `Secrets and variables` → `Actions`

3. **Crea un nuevo secreto**:
   - Click en **"New repository secret"**
   - **Name**: `WINCOVA_WEBHOOK_URL`
   - **Secret**: Pega la URL del webhook de arriba
   - Click en **"Add secret"**

---

### Paso 3: Verificar que Funciona

1. **Haz un cambio pequeño en el código**
   - Por ejemplo, edita `src/pages/Index.tsx`
   - Añade un comentario: `// Test webhook`

2. **Commit y push a GitHub**:
   ```bash
   git add .
   git commit -m "test: Verificar webhook de auditoría"
   git push origin main
   ```

3. **Verifica en GitHub Actions**:
   - Ve a: `https://github.com/[TU-USUARIO]/[TU-REPO]/actions`
   - Deberías ver el workflow "🔐 WINCOVA Security Audit Pipeline" ejecutándose
   - Espera a que termine (1-3 minutos)

4. **Verifica en tu dashboard**:
   - Ve a: `https://[TU-APP].lovableproject.com/admin/corrections`
   - Deberías ver las correcciones generadas por los agentes de IA

---

## 🔍 Troubleshooting

### ❌ No veo correcciones en `/admin/corrections`

**Posibles causas:**

1. **El secreto no está configurado correctamente**
   - Verifica en GitHub: `Settings` → `Secrets and variables` → `Actions`
   - El secreto debe llamarse exactamente: `WINCOVA_WEBHOOK_URL`
   - La URL debe ser: `https://ghbksqyioendvispcseu.supabase.co/functions/v1/github-audit-webhook`

2. **El workflow falló**
   - Ve a: `https://github.com/[TU-USUARIO]/[TU-REPO]/actions`
   - Busca el workflow que falló
   - Click en él para ver los logs de error

3. **Los agentes de IA no encontraron problemas**
   - Si tu código está bien, es posible que no haya correcciones
   - Intenta introducir un error intencional (ej: un botón sin `onClick`)

4. **El webhook no recibió los datos**
   - Verifica los logs del edge function en Lovable Cloud
   - Ve a: Settings → Tools → View Backend → Edge Functions → `github-audit-webhook`

---

### ❌ El workflow de GitHub Actions falla

**Verifica que tienes configurados estos secretos en GitHub:**

- ✅ `WINCOVA_WEBHOOK_URL` (el que acabas de crear)
- ✅ `OPENAI_API_KEY` (para los agentes de IA)

Si falta `OPENAI_API_KEY`:
1. Ve a: https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Agrégala como secreto en GitHub con el nombre `OPENAI_API_KEY`

---

### ⚠️ El webhook funciona pero no veo análisis de los agentes

**Posible causa:** Los agentes solo analizan cambios en ciertos archivos:

- **Security Auditor**: Analiza TODOS los cambios
- **UX Bot**: Solo analiza cambios en `src/` y `components/`

Si modificas archivos fuera de estas carpetas (ej: `docs/`, `README.md`), el UX Bot no se ejecutará.

---

## 📊 ¿Qué datos se envían al webhook?

El workflow envía un JSON con esta estructura:

```json
{
  "action": "completed",
  "workflow_run": {
    "id": "12345",
    "name": "🔐 WINCOVA Security Audit Pipeline",
    "head_branch": "main",
    "head_sha": "abc123...",
    "head_commit": {
      "message": "feat: Add new feature"
    },
    "status": "completed",
    "conclusion": "success",
    "security_analysis": {
      "agent": "WINCOVA Security Auditor v2.0",
      "model": "gpt-5",
      "summary": {
        "critical_count": 2,
        "important_count": 5,
        "suggestion_count": 8,
        "overall_risk": "medium"
      },
      "corrections": [...]
    },
    "ux_analysis": {
      "agent": "Ultra UX Bot v2.0",
      "model": "gpt-5",
      "summary": {
        "ux_score": 72,
        "revenue_at_risk_daily": 150,
        "critical_count": 1
      },
      "corrections": [...]
    }
  },
  "repository": {
    "full_name": "usuario/repo",
    "html_url": "https://github.com/usuario/repo"
  }
}
```

---

## 🎯 Próximos Pasos

Una vez configurado el webhook:

1. **Monitorea las correcciones** en `/admin/corrections`
2. **Revisa y aprueba** las correcciones sugeridas por los agentes
3. **Aplica las correcciones** para mejorar la calidad y seguridad de tu código
4. **Repite el ciclo** con cada push a GitHub

---

## 📚 Documentación Relacionada

- [WINCOVA AI Auditor DNA](./WINCOVA_AI_AUDITOR.md)
- [Ultra UX Bot DNA](./ULTRA_UX_BOT_DNA.md)
- [Dual Agent System](./DUAL_AGENT_SYSTEM.md)
- [AAHGPA Audit Log](./AAHGPA_AUDIT_LOG.md)

---

## 💡 Tips Adicionales

### Desactivar el webhook temporalmente

Si necesitas desactivar el análisis de IA temporalmente (ej: durante desarrollo local intensivo):

1. Ve a: `.github/workflows/wincova-audit.yml`
2. Comenta la sección del job `report`:
   ```yaml
   # report:
   #   name: 📡 Report to WINCOVA Dashboard
   #   ...
   ```

### Ajustar la frecuencia de análisis

El workflow se ejecuta en:
- **Push a `main` o `develop`**
- **Pull Requests a `main` o `develop`**
- **Manualmente** (workflow_dispatch)

Para cambiar esto, edita las líneas 3-10 de `.github/workflows/wincova-audit.yml`.

---

## 🆘 Soporte

Si tienes problemas con la configuración:

1. **Verifica los logs de GitHub Actions**
2. **Verifica los logs del edge function en Lovable Cloud**
3. **Consulta la documentación de WINCOVA AI Auditor**
4. **Abre un issue en el repositorio con los logs de error**

---

**✅ Una vez configurado, tu sistema de auditoría dual estará 100% operativo y revisará automáticamente cada cambio que hagas en el código.**
