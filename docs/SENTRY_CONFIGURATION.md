# Configuración de Sentry para Monitoreo de Errores

## Estado Actual

✅ **Código implementado** - Sentry está configurado en `src/lib/sentry.ts` y se inicializa en `src/main.tsx`  
⚠️ **Falta DSN** - Requiere configurar variable de entorno `VITE_SENTRY_DSN` para activar monitoreo

## Cómo Activar Sentry

### Paso 1: Crear cuenta en Sentry
1. Ve a [https://sentry.io](https://sentry.io)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto seleccionando "React"

### Paso 2: Obtener DSN
1. En tu proyecto de Sentry, ve a **Settings > Projects > [Tu Proyecto] > Client Keys (DSN)**
2. Copia el DSN (formato: `https://xxxxx@oXXXX.ingest.sentry.io/XXXXXX`)

### Paso 3: Configurar variable de entorno
Agrega el DSN como variable de entorno en Lovable:

```
VITE_SENTRY_DSN=https://xxxxx@oXXXX.ingest.sentry.io/XXXXXX
```

**Nota:** En Lovable, las variables de entorno para el frontend deben tener el prefijo `VITE_`

### Paso 4: Verificar funcionamiento
Una vez configurado el DSN:
1. La consola mostrará: `✅ Sentry initialized (production mode)`
2. Los errores se enviarán automáticamente a Sentry
3. Session replay se activará para el 10% de las sesiones

## Configuración Actual

### Performance Monitoring
- **Production**: 10% de transacciones rastreadas
- **Development**: 100% de transacciones rastreadas

### Session Replay
- **Sesiones normales**: 10% grabadas
- **Sesiones con errores**: 100% grabadas
- **Privacidad**: Todo el texto y media enmascarados

### Funciones Disponibles

```typescript
import { captureException, captureMessage, setUserContext, clearUserContext } from '@/lib/sentry';

// Capturar excepciones
try {
  // código
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Mensajes informativos
captureMessage('Usuario completó onboarding', 'info');

// Contexto de usuario
setUserContext({
  id: user.id,
  email: user.email,
  username: user.display_name
});

// Limpiar contexto al hacer logout
clearUserContext();
```

## Sin Sentry Configurado

Si `VITE_SENTRY_DSN` no está configurado:
- La consola mostrará: `⚠️ Sentry DSN not configured`
- Los errores se logearán en la consola del navegador
- La aplicación funcionará normalmente
- **Recomendación**: Configurar Sentry antes de lanzar a producción

## Criterio de Aprobación P0-PERF-001

**Estado**: ✅ **RESUELTO PARCIALMENTE**
- ✅ Código de Sentry implementado correctamente
- ⚠️ Requiere configuración de DSN por parte del usuario
- 📋 Documentación completa proporcionada

**Para considerar 100% resuelto**: El usuario debe agregar `VITE_SENTRY_DSN` a las variables de entorno del proyecto.

---

**Última actualización**: 2025-01-12  
**Responsable**: Sistema de desarrollo GiftApp
