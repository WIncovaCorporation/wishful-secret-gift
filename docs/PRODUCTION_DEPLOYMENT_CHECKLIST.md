# CHECKLIST DE DESPLIEGUE A PRODUCCIÓN

**Proyecto:** GiftApp MVP  
**Versión:** 1.0.0  
**Fecha:** 2025-01-12  

---

## 🚀 PRE-DESPLIEGUE (OBLIGATORIO)

### ✅ Verificación de Código y Build
- [x] Build de producción sin errores TypeScript
- [x] Todos los tests unitarios pasando (8/8)
- [x] No hay console.errors críticos
- [x] Linter de Supabase ejecutado
- [ ] Tests E2E ejecutados (pendiente - opcional)
- [x] Código committed a Git

### ✅ Seguridad
- [x] RLS habilitado en todas las tablas
- [x] Políticas RLS verificadas
- [x] No hay credenciales hardcodeadas
- [x] Secrets configurados en Supabase
- [ ] **P1: Habilitar Leaked Password Protection** ⚠️
- [ ] **P1: Implementar rate limiting en edge functions** ⚠️
- [ ] **P1: Configurar CORS restrictivo (no `'*'`)** ⚠️

### ✅ Base de Datos
- [x] Migraciones aplicadas exitosamente
- [x] Índices creados correctamente
- [x] Foreign keys funcionando
- [x] Integridad de datos verificada
- [x] Backup strategy documentada
- [ ] **P1: Backup testeado y recuperable** ⚠️

### ✅ Variables de Entorno
- [x] `VITE_SUPABASE_URL` configurada
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY` configurada
- [x] `VITE_SUPABASE_PROJECT_ID` configurada
- [ ] `VITE_SENTRY_DSN` (opcional)
- [ ] `VITE_GA_MEASUREMENT_ID` (opcional)

### ✅ Edge Functions
- [x] Todas las funciones desplegadas
- [x] Secrets de funciones configurados
- [ ] **P1: Rate limiting implementado** ⚠️
- [ ] **P1: CORS configurado correctamente** ⚠️
- [ ] Logs de funciones revisados

### ✅ Storage
- [x] Bucket `avatars` creado y público
- [ ] RLS policies de storage verificadas
- [ ] Upload limits configurados

---

## 🔍 SMOKE TESTS EN STAGING

### Flujo de Usuario Completo
- [x] Registro de nuevo usuario
- [x] Verificación de email (auto-confirm activo)
- [x] Login exitoso
- [x] Creación de grupo
- [x] Compartir código de grupo
- [x] Unirse a grupo con código
- [x] Sorteo con 3+ participantes
- [x] Visualización de asignación (anti-cheat)
- [x] Creación de lista de deseos
- [x] Ver lista de deseos de asignado
- [ ] Envío de mensaje anónimo
- [ ] Eliminación de cuenta (GDPR)

### Verificación Visual
- [x] Diseño responsivo en móvil
- [x] Dark mode funcional
- [x] Estados de carga presentes
- [x] Estados de error claros
- [x] Navegación intuitiva

---

## 📋 LEGAL Y CUMPLIMIENTO

### Documentación Legal
- [x] Política de Privacidad publicada
- [x] Términos de Servicio publicados
- [x] Footer con links a políticas
- [x] Información de contacto

### GDPR/CCPA
- [x] Política de privacidad incluye derechos de usuario
- [ ] **P1: Flujo de eliminación de cuenta** ⚠️
- [ ] **P1: Exportación de datos de usuario** ⚠️
- [ ] Cookie consent banner (si se usan cookies de tracking)

### Accesibilidad
- [x] WCAG 2.1 Level AA básico
- [ ] Testing con lectores de pantalla
- [ ] Auditoría con Lighthouse/axe

---

## 📊 MONITOREO Y OBSERVABILIDAD

### Error Tracking
- [x] Sentry configurado (código)
- [ ] `VITE_SENTRY_DSN` agregado (opcional)
- [ ] Alertas de errores configuradas

### Analytics
- [x] Google Analytics integrado (código)
- [ ] `VITE_GA_MEASUREMENT_ID` configurado (opcional)
- [ ] Eventos críticos trackeados

### Logs
- [x] Edge function logs accesibles
- [x] Database logs configurados
- [ ] Log aggregation configurado (opcional)

### Alertas
- [ ] Alerta de error rate > 5%
- [ ] Alerta de response time > 2s
- [ ] Alerta de database connection pool > 80%
- [ ] Monitoreo de uptime configurado

---

## 🚢 DESPLIEGUE

### Lovable Deploy
- [ ] Click en botón "Publish" en Lovable
- [ ] Seleccionar "Update" en publish dialog
- [ ] Verificar deploy exitoso
- [ ] URL de producción accesible

### Verificación Post-Deploy
- [ ] Smoke tests en producción (primeros 5 min)
- [ ] Verificar login funcional
- [ ] Verificar creación de grupo
- [ ] Verificar sorteo
- [ ] Sin errores en consola
- [ ] Logs de Supabase sin errores críticos

---

## 🔄 ROLLBACK (Si es necesario)

### Procedimiento de Rollback
1. **Identificar problema crítico** (error rate > 5%, funcionalidad bloqueada)
2. **En Lovable:**
   - Ir a History
   - Seleccionar versión anterior estable
   - Click en "Restore"
3. **Verificar rollback:**
   - Smoke tests pasando
   - Error rate normal
   - Funcionalidad core operativa
4. **Comunicar:**
   - Notificar a usuarios (si afecta)
   - Documentar causa del rollback
   - Plan de corrección

### Rollback de Base de Datos
- [ ] Scripts de rollback preparados
- [ ] Backup antes de deploy creado
- [ ] Procedimiento de restauración documentado

---

## 📢 COMUNICACIÓN

### Pre-Deploy
- [ ] Notificar a stakeholders de ventana de deploy
- [ ] Comunicar a usuarios si hay downtime planeado
- [ ] Status page actualizado (si aplica)

### Post-Deploy
- [ ] Notificar deploy exitoso a stakeholders
- [ ] Anuncio de nuevas características (si aplica)
- [ ] Update de status page

---

## 📈 POST-DEPLOY (Primeras 24-48h)

### Monitoreo Intensivo
- [ ] Revisar logs cada 1 hora (primeras 6 horas)
- [ ] Monitorear error rate
- [ ] Monitorear response times
- [ ] Revisar feedback de usuarios
- [ ] Tickets de soporte monitoreados

### Métricas a Revisar
- [ ] Error rate < 1%
- [ ] Response time < 2s promedio
- [ ] Database connection pool < 80%
- [ ] No alertas críticas
- [ ] Core Web Vitals verdes

### Validación Funcional
- [ ] 10 registros exitosos de usuarios nuevos
- [ ] 5 grupos creados sin errores
- [ ] 3 sorteos ejecutados correctamente
- [ ] Sin reportes de bugs críticos

---

## ✅ CRITERIOS DE ÉXITO

### Deploy Exitoso Si:
- ✅ Error rate < 1% (primeras 24h)
- ✅ Response time < 2s promedio
- ✅ Sin rollback necesario
- ✅ Smoke tests pasando en producción
- ✅ Feedback inicial positivo
- ✅ Sin bugs críticos reportados (primeras 48h)

### Deploy Fallido Si:
- ❌ Error rate > 5%
- ❌ Funcionalidad core bloqueada
- ❌ Vulnerabilidad de seguridad detectada
- ❌ Pérdida de datos
- ❌ Rollback ejecutado

---

## 🎯 SIGN-OFF FINAL

### Aprobaciones Requeridas
- [ ] **Tech Lead**: _____________________ Fecha: _____
- [ ] **Product Owner**: _________________ Fecha: _____
- [ ] **QA Lead**: _______________________ Fecha: _____
- [ ] **Security Review**: ________________ Fecha: _____

### Decisión Final
- [ ] **GO** - Proceder con deploy
- [ ] **NO-GO** - Bloquear deploy hasta resolver: _________________

### Notas:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Versión del Checklist:** 1.0  
**Última Actualización:** 2025-01-12  
**Próxima Revisión:** Post-deploy de v1.0.0
