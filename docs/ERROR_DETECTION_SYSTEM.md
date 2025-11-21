# Sistema de Detección y Corrección Automática de Errores

## 🎯 Objetivo

Identificar y corregir errores automáticamente después de cada modificación al código.

## 📋 Flujo de Trabajo

### 1. Antes de Modificar Código
- ✅ Revisar logs de edge functions relevantes
- ✅ Revisar console logs del navegador
- ✅ Revisar estado actual del código
- ✅ Identificar dependencias afectadas

### 2. Durante Modificación
- ✅ Agregar logging descriptivo con emojis para fácil identificación:
  - 📦 Datos recibidos
  - ✅ Operaciones exitosas
  - ❌ Errores detectados
  - ⚠️ Advertencias
  - 🔄 Procesamiento en curso
  
- ✅ Implementar manejo de errores robusto:
  ```typescript
  try {
    // código principal
  } catch (error) {
    console.error("❌ Error detallado:", error);
    // fallback o notificación al usuario
  }
  ```

### 3. Después de Modificar
- ✅ Verificar que los logs muestren información esperada
- ✅ Revisar que no haya errores en consola
- ✅ Validar que el flujo funcione end-to-end
- ✅ Documentar cambios realizados

## 🔍 Checklist de Debugging

### Edge Functions
- [ ] Los logs muestran que la función se ejecutó
- [ ] Los parámetros recibidos son correctos
- [ ] Las respuestas de APIs externas son exitosas
- [ ] Los datos se están transformando correctamente
- [ ] La respuesta enviada al cliente es válida

### Frontend
- [ ] No hay errores en consola del navegador
- [ ] Los datos se están recibiendo correctamente
- [ ] El estado se actualiza como se espera
- [ ] La UI refleja los cambios de estado
- [ ] Los toasts/notificaciones aparecen cuando deben

## 🛠️ Herramientas de Debugging

### Para Edge Functions
```bash
# Ver logs en tiempo real
supabase functions logs ai-shopping-assistant --follow

# Ver logs con filtro
supabase functions logs ai-shopping-assistant | grep "ERROR"
```

### Para Frontend
```javascript
// Logging estructurado
console.log("📦 Data received:", data);
console.log("✅ Processing successful");
console.error("❌ Error occurred:", error);
console.warn("⚠️ Warning:", warning);

// Debug de estado
console.table(stateObject);
```

## 🎨 Convenciones de Logging

### Emojis para Logging
- 📦 Datos/Paquetes recibidos
- ✅ Éxito/Completado
- ❌ Error crítico
- ⚠️ Advertencia
- 🔄 Procesamiento en curso
- 🎯 Objetivo alcanzado
- 🔍 Debugging/Investigación
- 💾 Guardado en DB
- 🌐 Request HTTP
- 🔑 Autenticación/Permisos

### Formato de Mensajes
```typescript
// BIEN: Descriptivo con contexto
console.log("📦 Chunk 3 received: 150 bytes");

// MAL: Vago sin contexto
console.log("data");
```

## 🚨 Errores Comunes y Soluciones

### 1. Streaming no muestra respuesta
**Síntoma:** El asistente carga pero no muestra texto

**Diagnóstico:**
1. Verificar logs de edge function - ¿se inició el streaming?
2. Verificar formato del parsing en cliente
3. Verificar que el Content-Type sea "text/event-stream"

**Solución:**
- Verificar que el formato de parsing coincida con la API
- Agregar logging en cada etapa del stream
- Verificar que se esté agregando el texto al mensaje

### 2. Error de API Key
**Síntoma:** 403 o "Invalid API Key"

**Diagnóstico:**
1. Verificar que el secret esté configurado en Supabase
2. Verificar que se esté usando la variable correcta
3. Verificar que la key tenga permisos correctos

**Solución:**
- Reconfigurar secret en Supabase dashboard
- Verificar en logs que se está leyendo correctamente
- Probar la key directamente en la API

### 3. Rate Limit Exceeded
**Síntoma:** 429 Too Many Requests

**Diagnóstico:**
1. Verificar cuota en console de la API
2. Verificar frecuencia de requests

**Solución:**
- Implementar exponential backoff
- Mostrar mensaje claro al usuario
- Agregar delay entre requests

## 📊 Métricas de Calidad

### Código de Calidad Debe Tener:
- ✅ Logging en puntos clave
- ✅ Manejo de errores con try/catch
- ✅ Mensajes de error descriptivos al usuario
- ✅ Validación de datos de entrada
- ✅ Timeout para operaciones async
- ✅ Fallbacks para cuando algo falla

### Código de Baja Calidad:
- ❌ Sin manejo de errores
- ❌ Console.logs sin contexto
- ❌ Errores silenciosos (catch vacío)
- ❌ Sin validación de datos
- ❌ Sin feedback al usuario

## 🔄 Proceso de Iteración

1. **Implementar** con logging extensivo
2. **Probar** en ambiente real
3. **Revisar logs** para identificar problemas
4. **Corregir** basado en logs
5. **Validar** que la corrección funcionó
6. **Documentar** el cambio en CHANGELOG

## 📝 Template de Commit

```
Fix: [Descripción breve del problema]

Problema:
- [Qué estaba fallando]
- [Por qué estaba fallando]

Solución:
- [Qué se cambió]
- [Por qué esto lo arregla]

Testing:
- [Cómo se validó]
- [Qué logs confirman el fix]
```

## 🎓 Mejores Prácticas

1. **Siempre agregar logging** antes de hacer cambios complejos
2. **Verificar logs** inmediatamente después del cambio
3. **Documentar** comportamientos inesperados
4. **Crear tests** para casos edge que causaron bugs
5. **Mantener** este documento actualizado con nuevos patterns

---

**Última actualización:** 2025-11-21
**Responsable:** Sistema de IA Givlyn
