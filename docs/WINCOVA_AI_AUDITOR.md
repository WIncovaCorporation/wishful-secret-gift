# 🤖 WINCOVA Security Auditor v2.0

## Identidad del Agente

**Nombre:** WINCOVA Security Auditor  
**Versión:** 2.0  
**Modelo Base:** OpenAI GPT-5  
**Temperatura:** 0.2 (alta precisión, baja creatividad)  
**Max Tokens:** 4000  
**Propósito:** Auditoría automatizada de código en tiempo real

---

## 🎯 Misión

Garantizar que cada commit al repositorio cumpla con estándares de nivel mundial en:
- 🔐 **Seguridad** (OWASP Top 10, CVEs conocidos)
- ⚡ **Performance** (Core Web Vitals, optimización)
- 🎨 **Accesibilidad** (WCAG 2.1 Level AA)
- 🏗️ **Arquitectura** (Clean Code, SOLID, DRY)
- 💰 **Eficiencia** (Costo de queries, API calls)

---

## 🔬 Capas de Análisis

### 🔴 CRITICAL - Seguridad (Fix Inmediato)

**Qué detecta:**
- Credenciales hardcodeadas (API keys, passwords, tokens)
- Vulnerabilidades OWASP Top 10:
  - SQL Injection
  - Cross-Site Scripting (XSS)
  - Cross-Site Request Forgery (CSRF)
  - Insecure Direct Object References (IDOR)
  - Security Misconfiguration
- Bypass de Row Level Security (RLS) en Supabase
- Datos sensibles sin encriptar
- API endpoints sin autenticación
- CORS mal configurado
- Rate limiting ausente

**Ejemplo de detección:**
```typescript
// ❌ DETECTADO: Credencial hardcodeada
const API_KEY = "sk-proj-abc123xyz";

// ✅ SUGERIDO: Usar variable de entorno
const API_KEY = import.meta.env.VITE_API_KEY;
```

---

### 🟡 IMPORTANT - Performance & Calidad (Fix en Sprint)

**Qué detecta:**
- Memory leaks (useEffect sin cleanup)
- Re-renders innecesarios
- Queries N+1 en base de datos
- Imágenes sin lazy loading
- Bundles pesados (imports innecesarios)
- Código duplicado
- Violaciones de principios SOLID
- Props drilling excesivo

**Ejemplo de detección:**
```typescript
// ❌ DETECTADO: useEffect sin cleanup causa memory leak
useEffect(() => {
  const interval = setInterval(() => fetchData(), 1000);
  // Missing cleanup!
}, []);

// ✅ SUGERIDO: Agregar cleanup
useEffect(() => {
  const interval = setInterval(() => fetchData(), 1000);
  return () => clearInterval(interval);
}, []);
```

---

### 🟢 SUGGESTION - UX & Mejoras (Considerar para Refactoring)

**Qué detecta:**
- Falta de accesibilidad (alt text, aria-labels)
- Estados de loading/error faltantes
- Responsive design issues
- Código legacy que puede modernizarse
- Nombres poco descriptivos
- Comentarios/documentación faltantes
- Console.logs olvidados en producción

**Ejemplo de detección:**
```typescript
// ❌ DETECTADO: Imagen sin alt text
<img src={user.avatar} />

// ✅ SUGERIDO: Agregar accesibilidad
<img 
  src={user.avatar} 
  alt={`Avatar de ${user.name}`}
  loading="lazy"
/>
```

---

## 📊 Formato de Respuesta

El agente siempre responde en JSON estructurado:

```json
{
  "agent": "WINCOVA Security Auditor v2.0",
  "model": "gpt-5",
  "timestamp": "2025-11-15T21:30:00Z",
  "summary": {
    "critical_count": 2,
    "important_count": 5,
    "suggestion_count": 8,
    "overall_risk": "medium"
  },
  "corrections": [
    {
      "severity": "critical",
      "category": "security",
      "file": "src/components/Auth.tsx",
      "line": 45,
      "title": "API Key hardcodeada detectada",
      "description": "Se encontró una clave de API hardcodeada en el código. Esto expone credenciales sensibles en el repositorio y puede ser explotado por atacantes.",
      "code_before": "const API_KEY = 'sk-proj-abc123';",
      "code_after": "const API_KEY = import.meta.env.VITE_API_KEY;",
      "references": [
        "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password"
      ],
      "impact": "ALTO: Exposición de credenciales que puede resultar en acceso no autorizado a servicios externos."
    }
  ]
}
```

---

## 🎛️ Configuración

### Stack Tecnológico Conocido

El agente está pre-configurado con conocimiento profundo de:

```yaml
Frontend:
  - React 18 (Hooks, Context API, Suspense)
  - TypeScript (tipos estrictos)
  - Vite (build tool)
  - Tailwind CSS (utility-first)
  - shadcn/ui (componentes)
  - React Query (data fetching)

Backend:
  - Supabase (PostgreSQL)
  - Edge Functions (Deno)
  - Row Level Security (RLS)
  - Supabase Auth

CI/CD:
  - GitHub Actions
  - Automated testing
  - Automated deployment
```

### Patrones Recomendados

El agente sugiere seguir:

1. **React Patterns:**
   - Custom Hooks para lógica reutilizable
   - Compound Components para composición
   - Render Props para flexibilidad
   - Context + Reducer para estado global

2. **TypeScript:**
   - Tipos explícitos (evitar `any`)
   - Interfaces para contratos
   - Generics para reutilización
   - Type guards para seguridad

3. **Supabase:**
   - RLS policies para todas las tablas
   - Functions para lógica compleja
   - Realtime para updates en vivo
   - Storage policies correctas

---

## 🔧 Mantenimiento y Mejora Continua

### Métricas del Agente

El sistema rastrea:

- **Precisión:** % de correcciones aceptadas vs rechazadas
- **Cobertura:** % de problemas detectados vs encontrados en producción
- **Tiempo de Respuesta:** Tiempo promedio de análisis
- **Impacto:** Problemas críticos evitados

### Actualización del Prompt

Para mejorar el agente, edita el prompt en:
`.github/workflows/wincova-audit.yml` línea 178

### Retroalimentación

Cuando rechaces una corrección, agrega notas detalladas:
- ¿Por qué fue incorrecta?
- ¿Qué contexto faltaba?
- ¿Cómo podría mejorar el agente?

---

## 🚀 Roadmap

### v2.1 (Próximo)
- [ ] Análisis de dependencias vulnerables (npm audit)
- [ ] Detección de código muerto (tree shaking)
- [ ] Análisis de bundle size
- [ ] Sugerencias de refactoring automático

### v3.0 (Futuro)
- [ ] Machine Learning para aprender de correcciones pasadas
- [ ] Integración con Sentry para correlacionar bugs
- [ ] Auto-fix para problemas simples
- [ ] Análisis de accesibilidad con screenshots

---

## 📞 Contacto

**Equipo:** WINCOVA DevOps  
**Email:** devops@wincova.com  
**Slack:** #wincova-ai-auditor  

---

## 📄 Licencia

Propiedad de WINCOVA. Uso interno únicamente.
