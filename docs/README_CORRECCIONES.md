# Sistema de Correcciones Automáticas - Índice de Documentación

> 🎯 **Sistema inteligente de detección, revisión y aplicación automática de correcciones de código mediante IA**

---

## 📖 Documentación Disponible

### 🚀 Para Empezar

| Documento | Descripción | Tiempo de Lectura |
|-----------|-------------|-------------------|
| **[QUICK_START_CORRECCIONES.md](./QUICK_START_CORRECCIONES.md)** | Guía rápida de inicio en 5 minutos | ⏱️ 5 min |
| **[FLUJO_VISUAL_CORRECCIONES.md](./FLUJO_VISUAL_CORRECCIONES.md)** | Diagramas y flujos visuales del sistema | ⏱️ 10 min |

### 📚 Documentación Completa

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[SISTEMA_CORRECCIONES_AUTOMATICAS.md](./SISTEMA_CORRECCIONES_AUTOMATICAS.md)** | Documentación técnica completa del sistema | 👨‍💻 Desarrolladores |
| **[AI_AGENT_INTEGRATION.md](./AI_AGENT_INTEGRATION.md)** | Integración con diferentes agentes AI | 🤖 Integradores |

---

## 🎯 ¿Qué Documento Leer?

### Si eres **Administrador** y quieres:
- ✅ Empezar a usar el sistema → [QUICK_START_CORRECCIONES.md](./QUICK_START_CORRECCIONES.md)
- ✅ Entender el flujo visualmente → [FLUJO_VISUAL_CORRECCIONES.md](./FLUJO_VISUAL_CORRECCIONES.md)

### Si eres **Developer** y quieres:
- ✅ Configurar el sistema → [SISTEMA_CORRECCIONES_AUTOMATICAS.md](./SISTEMA_CORRECCIONES_AUTOMATICAS.md) (Sección: Arquitectura)
- ✅ Entender cómo funciona internamente → [SISTEMA_CORRECCIONES_AUTOMATICAS.md](./SISTEMA_CORRECCIONES_AUTOMATICAS.md) (Sección: Componentes)
- ✅ Debuggear problemas → [SISTEMA_CORRECCIONES_AUTOMATICAS.md](./SISTEMA_CORRECCIONES_AUTOMATICAS.md) (Sección: Troubleshooting)

### Si eres **Integrador de AI** y quieres:
- ✅ Integrar con un agente AI → [AI_AGENT_INTEGRATION.md](./AI_AGENT_INTEGRATION.md)
- ✅ Ver ejemplos de código → [AI_AGENT_INTEGRATION.md](./AI_AGENT_INTEGRATION.md) (Sección: Ejemplos)
- ✅ APIs y endpoints → [SISTEMA_CORRECCIONES_AUTOMATICAS.md](./SISTEMA_CORRECCIONES_AUTOMATICAS.md) (Sección: APIs)

---

## 🚀 Quick Links

### Para Administradores

```
🔗 UI Principal: /admin/corrections
🔗 Documentación Rápida: docs/QUICK_START_CORRECCIONES.md
🔗 Comando para aplicar correcciones:
   "Aplica automáticamente las correcciones aprobadas..."
```

### Para Desarrolladores

```
🔗 Base URL: https://ghbksqyioendvispcseu.supabase.co
🔗 API Correcciones: /functions/v1/get-approved-corrections
🔗 API Marcar Aplicadas: /functions/v1/mark-corrections-applied
```

### Para Agentes AI

```
🔗 Endpoint público GET: /functions/v1/get-approved-corrections
🔗 Endpoint público POST: /functions/v1/mark-corrections-applied
🔗 Documentación de integración: docs/AI_AGENT_INTEGRATION.md
```

---

## 📊 Estructura del Sistema

```
Sistema de Correcciones Automáticas
│
├── 🎯 Detección
│   ├── GitHub Webhook
│   ├── OpenAI GPT-4o-mini Analysis
│   └── Supabase ai_corrections table
│
├── 👁️ Revisión
│   ├── Admin UI (/admin/corrections)
│   ├── Aprobar/Rechazar correcciones
│   └── Agregar notas
│
├── 🤖 Aplicación
│   ├── API pública para agentes AI
│   ├── Múltiples agentes soportados
│   └── Marcado automático como "applied"
│
└── 📈 Auditoría
    ├── AAHGPA logs
    ├── GitHub audit logs
    └── Métricas y reportes
```

---

## 🎬 Demo en 3 Pasos

### 1️⃣ Developer hace push
```bash
git add .
git commit -m "feat: nueva feature"
git push origin main
```

### 2️⃣ Admin revisa y aprueba
```
1. Ve a /admin/corrections
2. Click "Aprobar" en correcciones
3. Click "Copiar Comando para Aplicar"
```

### 3️⃣ Agente AI aplica automáticamente
```
1. Pega comando en chat de Lovable
2. Correcciones se aplican al código
3. Push automático a GitHub
```

---

## 📈 Métricas Actuales

| Métrica | Valor |
|---------|-------|
| **Correcciones Aplicadas** | 18 |
| **Correcciones Pendientes** | 15 |
| **Tasa de Aprobación** | 75% |
| **Tiempo Promedio de Aplicación** | 1-2 min |

---

## 🔥 Features Principales

- ✅ **Detección automática** mediante análisis de OpenAI
- ✅ **Revisión manual** con sistema de aprobación/rechazo
- ✅ **Aplicación automática** por cualquier agente AI
- ✅ **Trazabilidad completa** con logs AAHGPA
- ✅ **Auditoría integrada** con GitHub webhooks
- ✅ **Sistema agnóstico** de agente AI
- ✅ **APIs públicas** para fácil integración
- ✅ **UI intuitiva** para administradores
- ✅ **Validación robusta** de datos
- ✅ **Soporte multilenguaje** (TypeScript, JavaScript, etc.)

---

## 🤝 Agentes AI Soportados

| Agente | Status | Documentación |
|--------|--------|---------------|
| **Lovable AI** | ✅ Funcionando | [Ver ejemplo](./AI_AGENT_INTEGRATION.md#lovable-ai-este-chat) |
| **Replit AI** | ✅ Soportado | [Ver código](./AI_AGENT_INTEGRATION.md#replit-ai) |
| **Claude AI** | ✅ Soportado | [Ver prompt](./AI_AGENT_INTEGRATION.md#claude-ai--gpt-4--chatgpt) |
| **Cursor AI** | ✅ Soportado | [Ver config](./AI_AGENT_INTEGRATION.md#cursor-ai) |
| **Agente Custom** | ✅ Soportado | [Ver API](./SISTEMA_CORRECCIONES_AUTOMATICAS.md#apis-y-endpoints) |

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase PostgreSQL
- **AI:** OpenAI GPT-4o-mini
- **CI/CD:** GitHub Webhooks
- **Validación:** Zod
- **UI:** Shadcn/ui

---

## 📞 Soporte y Ayuda

### ❓ ¿Tienes problemas?

1. **Revisa la sección de Troubleshooting:**  
   [SISTEMA_CORRECCIONES_AUTOMATICAS.md - Troubleshooting](./SISTEMA_CORRECCIONES_AUTOMATICAS.md#troubleshooting)

2. **Verifica los logs:**
   - Logs de Edge Functions en Supabase Dashboard
   - Logs de GitHub Webhook en GitHub Settings

3. **Consulta la base de datos:**
   ```sql
   SELECT * FROM ai_corrections ORDER BY created_at DESC LIMIT 10;
   ```

### 📧 Contacto

- **Issues:** Abre un issue en GitHub
- **Email:** soporte@wincova.app
- **Documentación:** Revisa los docs en `docs/`

---

## 🗺️ Roadmap

### ✅ Completado (v1.0)
- [x] Detección automática de correcciones
- [x] UI de revisión para administradores
- [x] APIs públicas para agentes AI
- [x] Integración con Lovable AI
- [x] Documentación completa
- [x] Sistema de validación robusto

### 🚧 En Progreso (v1.1)
- [ ] Dashboard de métricas
- [ ] Notificaciones automáticas
- [ ] Exportación de reportes
- [ ] Integración con Slack

### 🔮 Planeado (v2.0)
- [ ] Aprendizaje automático para mejorar prompts
- [ ] Predicción de correcciones que serán aprobadas
- [ ] Auto-merge de correcciones aprobadas
- [ ] Soporte para más lenguajes (Python, Java, Go)

---

## 📄 Licencia

Este sistema es parte del proyecto Wincova y sigue la misma licencia del proyecto principal.

---

## 🙏 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Lee la documentación completa
2. Abre un issue para discutir cambios grandes
3. Sigue las mejores prácticas del sistema
4. Actualiza la documentación si es necesario

---

## 🎉 ¡Empieza Ahora!

**Paso 1:** Lee [QUICK_START_CORRECCIONES.md](./QUICK_START_CORRECCIONES.md)  
**Paso 2:** Ve a `/admin/corrections`  
**Paso 3:** ¡Empieza a revisar correcciones!

---

**Última actualización:** 2025-11-17  
**Versión del Sistema:** 1.0.0  
**Mantenedores:** Equipo Wincova
