# Configuración de Ambientes: Producción y Staging

## 🔗 REPOSITORIO OFICIAL
**GitHub Repository**: https://github.com/WIncovaCorporation/wishful-secret-gift

## 📋 RESUMEN EJECUTIVO

Este documento explica cómo configurar **dos ambientes automáticos** para Winkova:

1. **PRODUCCIÓN** (dominio temporal Vercel) - Solo código aprobado y probado
2. **STAGING/PREVIEW** - Pruebas automáticas de cada cambio

**⚠️ IMPORTANTE - DOMINIO TEMPORAL:**
- **Backend**: Permanece en Lovable Cloud (NO migrar sin autorización)
- **Dominio de producción**: Pendiente de definición por el propietario
- **Dominio temporal**: Usar URL de Vercel (ej: `wincova-platform.vercel.app`)
- **NO configurar dominio custom** hasta recibir confirmación del propietario
- **Acceso**: Propietario debe ser OWNER en Vercel y GitHub

**Resultado final:** Cada cambio genera automáticamente una URL de prueba. Solo los cambios aprobados llegan a producción.

---

## 🎯 CONFIGURACIÓN PASO A PASO

### PASO 1: Conectar GitHub a Vercel (5 minutos)

1. **Ir a Vercel:**
   - URL: https://vercel.com/login
   - Login con GitHub

2. **Importar proyecto:**
   - Click en "Add New..." → "Project"
   - Buscar el repositorio: `WIncovaCorporation/wishful-secret-gift`
   - Click en "Import"
   
   **⚠️ IMPORTANTE:**
   - El propietario debe tener rol de OWNER en Vercel
   - Todas las integraciones deben estar bajo la cuenta/organización del propietario

3. **Configurar el proyecto:**

   **Framework Preset:** Vite
   
   **Root Directory:** `./` (raíz del proyecto)
   
   **Build Command:**
   ```bash
   npm run build
   ```
   
   **Output Directory:**
   ```
   dist
   ```
   
   **Install Command:**
   ```bash
   npm install
   ```

4. **Variables de Entorno (Environment Variables):**

   **⚠️ CRÍTICO:** Añadir las siguientes variables en Vercel:

   ```env
   # Supabase/Lovable Cloud
   VITE_SUPABASE_URL=https://ghbksqyioendvispcseu.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYmtzcXlpb2VuZHZpc3Bjc2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTU4OTAsImV4cCI6MjA3ODI3MTg5MH0._0TDIkEXYv7ARp0CDhRFUGTacVlgCBcqoBvHjDIHywo
   VITE_SUPABASE_PROJECT_ID=ghbksqyioendvispcseu

   # Analytics (si están configurados)
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

   # App Config
   VITE_APP_ENV=production
   VITE_APP_VERSION=1.0.0
   ```

   **Dónde añadirlas:**
   - En Vercel → Project Settings → Environment Variables
   - Aplica a: **Production, Preview, Development** (todas)

5. **Deploy:**
   - Click en "Deploy"
   - Esperar 2-3 minutos
   - ✅ Tu app estará en una URL temporal de Vercel (ej: `wincova-platform.vercel.app`)

---

### PASO 2: Dominio Custom (PENDIENTE DE CONFIRMACIÓN)

**⚠️ NO CONFIGURAR TODAVÍA - ESPERAR INSTRUCCIONES DEL PROPIETARIO**

Por ahora, usar el dominio temporal de Vercel para todos los ambientes.

**Cuando el propietario confirme el subdominio definitivo:**

1. **En Vercel:**
   - Ir a Project Settings → Domains
   - Click en "Add Domain"
   - Escribir el subdominio confirmado (ej: `app.winkova.com`)
   - Click en "Add"

2. **Vercel proporcionará registros DNS:**
   ```
   CNAME [subdominio] → cname.vercel-dns.com
   ```

3. **En SiteGround:**
   - Login a SiteGround
   - Ir a: Sitios Web → Dominios → winkova.com → DNS Zone Editor
   - Añadir registro CNAME proporcionado por Vercel
   - Guardar cambios

4. **Esperar propagación DNS:**
   - Tiempo estimado: 15-30 minutos (puede tardar hasta 72 horas)
   - Verificar con: https://dnschecker.org

5. **Verificar SSL:**
   - Vercel automáticamente genera certificado SSL/HTTPS
   - Confirmar "SSL: Active" en Vercel

---

### PASO 3: Configurar Git Workflow (Automático)

**Vercel automáticamente detecta:**

#### 🟢 **Production (main branch)**
- **Trigger:** Cada push a `main`
- **URL:** Dominio temporal Vercel (ej: `wincova-platform.vercel.app`)
- **Uso:** Solo código aprobado y probado
- **Nota:** Cuando se configure dominio custom, cambiará a la URL definitiva

#### 🟡 **Preview/Staging (feature branches)**
- **Trigger:** Cada push a cualquier otro branch
- **URL:** Auto-generada por Vercel (ej: `wishful-secret-gift-git-feature-x.vercel.app`)
- **Uso:** Pruebas y desarrollo

#### 🔵 **Pull Requests**
- **Trigger:** Cada vez que se crea un PR
- **URL:** Única para cada PR
- **Uso:** Revisión de cambios antes de merge

---

## 🚀 FLUJO DE TRABAJO DIARIO

### Para el Equipo Técnico:

1. **Crear una nueva feature:**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # Hacer cambios en el código
   git add .
   git commit -m "feat: añadir nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

2. **Vercel automáticamente:**
   - Detecta el nuevo branch
   - Ejecuta el build
   - Genera una **Preview URL** única
   - Envía notificación a GitHub (en el PR o commit)

3. **Crear Pull Request:**
   - Ir a GitHub
   - Click en "Compare & pull request"
   - Describir los cambios
   - Añadir como reviewer al Product Owner

4. **Vercel comenta en el PR con:**
   ```
   ✅ Preview deployment ready!
   🔗 https://app-winkova-git-feature-nueva-funcionalidad-team.vercel.app
   
   Inspect: https://vercel.com/deployments/xxx
   ```

### Para el Product Owner (Sin conocimientos técnicos):

1. **Recibir notificación:**
   - Email de GitHub: "New Pull Request"
   - Ver el preview link directamente en el PR

2. **Revisar cambios:**
   - Click en la URL de preview
   - Probar la funcionalidad en vivo
   - Verificar que todo funciona correctamente

3. **Aprobar o rechazar:**
   - **Si está bien:** Comment en el PR: "Aprobado ✅" → Equipo hace merge a `main`
   - **Si hay problemas:** Comment con feedback → Equipo corrige y vuelve a generar preview

4. **Deploy a Producción:**
   - Cuando el PR se mergea a `main`
   - Vercel automáticamente deploya a `app.winkova.com`
   - Cambios visibles en 2-3 minutos

---

## 📊 ACCESOS Y URLS

### URLs del Proyecto:

| Ambiente | URL | Propósito |
|----------|-----|-----------|
| **Producción** | `https://app.winkova.com` | App pública para clientes |
| **Staging** | Auto-generada por branch | Pruebas internas |
| **Preview PR** | Auto-generada por PR | Revisión de cambios específicos |

### Accesos Necesarios:

1. **GitHub:**
   - URL: https://github.com/tu-org/winkova-giftapp
   - Rol requerido: Contributor o higher
   - Ver PRs, comentar, aprobar

2. **Vercel Dashboard:**
   - URL: https://vercel.com/dashboard
   - Ver: Deployments, logs, analytics
   - Acciones: Rollback, re-deploy

---

## 🔒 SEGURIDAD Y CONTROL

### Protecciones Automáticas:

✅ **Branch protection en `main`:**
- Requiere Pull Request para cambios
- Requiere aprobación de reviewer
- No se puede hacer push directo a `main`

✅ **Preview URLs privadas:**
- Solo accesibles para el equipo (si se configura)
- No indexadas por Google
- Expiran después de cierto tiempo

✅ **Rollback instantáneo:**
- Si algo falla en producción
- Vercel permite volver a versión anterior en 1 click

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Después de la Configuración Inicial:

- [ ] Vercel conectado a GitHub
- [ ] Variables de entorno configuradas
- [ ] Dominio `app.winkova.com` añadido
- [ ] DNS CNAME configurado en SiteGround
- [ ] SSL activo en Vercel
- [ ] Deploy de prueba exitoso
- [ ] Preview URL generada correctamente
- [ ] Notificaciones de GitHub activas
- [ ] Product Owner tiene acceso a GitHub
- [ ] Product Owner tiene acceso a Vercel (opcional)

### Para Cada Deploy:

- [ ] Cambios probados en preview URL
- [ ] Product Owner revisó y aprobó
- [ ] PR mergeado a `main`
- [ ] Deploy automático a producción exitoso
- [ ] Smoke tests pasados (auth, AI, productos)
- [ ] No hay errores en Sentry
- [ ] Analytics funcionando

---

## 🆘 TROUBLESHOOTING

### "Mi preview URL no se genera"

**Solución:**
1. Verificar que Vercel está conectado al repo de GitHub
2. Ir a Vercel → Project Settings → Git
3. Asegurar que "Automatic deployments" está activado
4. Re-trigger deploy: hacer un commit vacío
   ```bash
   git commit --allow-empty -m "trigger deploy"
   git push
   ```

### "El dominio no resuelve"

**Solución:**
1. Verificar DNS con: https://dnschecker.org
2. Confirmar que el CNAME apunta a `cname.vercel-dns.com`
3. Esperar hasta 72 horas para propagación completa
4. En SiteGround, eliminar cualquier registro A o CNAME conflictivo

### "Variables de entorno no funcionan"

**Solución:**
1. Ir a Vercel → Project Settings → Environment Variables
2. Verificar que las variables tienen el prefijo `VITE_`
3. Confirmar que están aplicadas a "Production, Preview, Development"
4. Re-deploy el proyecto para aplicar cambios

### "SSL no se activa"

**Solución:**
1. Verificar que el DNS está correctamente configurado
2. Esperar 15-30 minutos después de configurar DNS
3. Si persiste, ir a Vercel → Domains → Force SSL renewal
4. Contactar soporte de Vercel si es necesario

---

## 📞 CONTACTO Y SOPORTE

### Para el Equipo:

- **GitHub Issues:** Para reportar bugs o solicitar features
- **Vercel Support:** https://vercel.com/support
- **Documentación Vercel:** https://vercel.com/docs

### Para Product Owner:

- **Revisar PRs:** GitHub → Pull Requests → Ver lista
- **Ver Deploys:** Vercel Dashboard → Deployments
- **Reportar Issues:** Comentar directamente en el PR o crear issue en GitHub

---

## 🎉 RESULTADO FINAL

Después de seguir esta guía, tendrás:

✅ **Producción estable:** Solo código aprobado en `app.winkova.com`

✅ **Staging automático:** Cada cambio genera preview URL

✅ **Control total:** Revisas y aprobas antes de producción

✅ **Cero downtime:** Deploys instantáneos y seguros

✅ **Rollback fácil:** Volver a versión anterior en segundos

✅ **Sin intervención técnica:** Todo automatizado

---

## 📅 PRÓXIMOS PASOS

1. **[AHORA]** Configurar Vercel + GitHub (15 minutos)
2. **[HOY]** Configurar dominio `app.winkova.com` (30 minutos + espera DNS)
3. **[MAÑANA]** Hacer primer deploy de prueba y validar flujo
4. **[ESTA SEMANA]** Entrenar al equipo en el flujo de PRs
5. **[PRÓXIMA SEMANA]** Deploy final a producción con afiliados configurados

---

**¿Todo claro? Cuando esté configurado, confirma y te envío los enlaces de acceso.**
