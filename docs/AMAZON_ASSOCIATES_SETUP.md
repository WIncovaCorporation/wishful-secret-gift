# 🚀 Guía de Registro en Amazon Associates para Wincova Corporation

**PRIORIDAD CRÍTICA**: Este registro debe completarse HOY para empezar a generar comisiones.

---

## ✅ PREREQUISITOS (YA LOS TIENES)

- ✅ Wincova Corporation registrada en Tennessee, USA
- ✅ Dominio activo: wincova.com
- ✅ Aplicación funcionando: GiftApp
- ✅ Sistema de tracking de affiliate links implementado

---

## 📋 PASO 1: INFORMACIÓN NECESARIA PARA REGISTRO

Prepara esta información ANTES de empezar:

### Datos de Wincova Corporation:
- **Nombre Legal**: Wincova Corporation
- **Estado de Registro**: Tennessee, USA
- **Dirección Fiscal**: [Tu dirección registrada en Tennessee]
- **EIN (Tax ID)**: [Tu EIN de Wincova Corp]
- **Email Corporativo**: admin@wincova.com (o el que uses)
- **Teléfono**: [Teléfono de contacto de Wincova]

### Datos de la Aplicación:
- **URL Principal**: https://wincova.com
- **Descripción del Negocio**: 
  ```
  Wincova es una plataforma AI-powered para gestión de regalos y listas de deseos. 
  Ayudamos a usuarios a descubrir, organizar y comprar regalos perfectos usando 
  inteligencia artificial. Nuestro asistente AI recomienda productos personalizados 
  de Amazon y otras tiendas.
  ```
- **Tráfico Mensual Estimado**: Inicialmente 100-500 visitantes/mes (aumentará con marketing)
- **Método de Monetización**: Affiliate marketing + subscripciones premium

---

## 🔗 PASO 2: REGISTRO EN AMAZON ASSOCIATES

### A. Accede al Portal

1. Ve a: **https://affiliate-program.amazon.com/**
2. Haz clic en **"Sign Up"** o **"Join Now for Free"**
3. **IMPORTANTE**: Usa el email corporativo de Wincova (no personal)

### B. Completa la Información de Cuenta

**Pantalla 1: Account Information**
- **Email**: admin@wincova.com
- **Password**: [Usa un password manager, contraseña fuerte]
- **Re-enter password**: [Confirma]

**Pantalla 2: Payee Information**
- **Payee Name**: Wincova Corporation
- **Address Line 1**: [Dirección de Tennessee]
- **City**: [Ciudad]
- **State**: Tennessee
- **Zip Code**: [Código postal]
- **Phone Number**: [Teléfono de Wincova]
- **Is this a business?**: ✅ **YES**
- **Business Type**: Corporation
- **Tax ID (EIN)**: [Tu EIN]

### C. Website & Mobile App Information

**Pantalla 3: Enter Your Website(s) or Mobile App(s)**

1. **Website URL**: `wincova.com`
2. Haz clic en **"Add"**
3. Si te pregunta más URLs, agrega:
   - `app.wincova.com` (si usas subdominio)

**Tipo de Sitio Web**:
- ☑️ App (Mobile or Desktop)
- ☑️ Website/Blog

**Descripción de tu sitio (inglés)**:
```
Wincova is an AI-powered gift management platform that helps users discover, 
organize, and purchase perfect gifts. Our AI shopping assistant provides 
personalized product recommendations from Amazon and other retailers. Users can 
create wishlists, manage gift exchanges, and get intelligent gift suggestions 
based on recipient preferences, occasion, and budget.
```

**Tópicos principales**:
- Gifts & Registry
- Shopping
- Technology & Electronics
- Home & Garden
- Toys & Games

**¿Qué tipo de productos vas a promocionar?**:
```
General merchandise including gifts, electronics, home goods, toys, books, 
and other products available on Amazon.com that are suitable as gifts or 
personal purchases.
```

**¿Cómo generas tráfico?** (selecciona todos los que aplican):
- ☑️ Search Engine Optimization (SEO)
- ☑️ Social Media (Facebook, Instagram, Twitter)
- ☑️ Email Marketing
- ☑️ Online Advertising (Google Ads, Facebook Ads)
- ☑️ Mobile App

**¿Cómo usarás los links de afiliado?**:
```
We integrate affiliate links directly in our AI shopping assistant recommendations. 
When users ask for gift suggestions, our AI provides curated product recommendations 
with direct links to Amazon. Users can save products to their wishlists or click 
through to purchase on Amazon.
```

**¿Cómo generas ingresos actualmente?**:
- Affiliate marketing
- Subscription fees (Premium memberships)
- Планируется: Future advertising

**¿Cuántos visitantes únicos tienes al mes?**:
- Selecciona: **Under 500** (honestamente, al inicio)
- *Nota: Esto no afecta tu aprobación, Amazon valora más la calidad que cantidad*

**¿Cómo construiste tu sitio?**:
- Custom web application (React, Supabase, Tailwind CSS)

### D. Profile Information

**Pantalla 4: Your Profile**

**Associate Store ID** (tu Tracking ID):
- Amazon te sugerirá algo como: `wincova-20`
- **ACEPTA ESTE ID** - Es el que ya configuramos en el código
- Si no está disponible, prueba:
  - `wincovacorp-20`
  - `wincovacom-20`
  - `wincovagifts-20`

**Preferred Store**:
- Selecciona: **Amazon.com**

**¿Cómo supiste de Amazon Associates?**:
- Selecciona: Online (search, social media, etc.)

### E. Verificación de Identidad

**Pantalla 5: Phone Verification**
- Ingresa tu número de teléfono de Wincova
- Recibirás un código PIN vía SMS
- Ingresa el PIN para verificar

### F. Payment & Tax Information

**Pantalla 6: Payment Information**

**Selecciona método de pago**:
- **Recomendado**: Direct Deposit (ACH)
  - Necesitarás:
    - Nombre del banco
    - Routing number
    - Account number
    - Account holder name: Wincova Corporation

**Pago mínimo**: $10 USD

**Tax Interview**:
- Completarás el formulario W-9 (ya que Wincova es empresa USA)
- Información requerida:
  - Legal Name: Wincova Corporation
  - Business Type: Corporation
  - EIN: [Tu EIN]
  - Address: [Dirección de Tennessee]

---

## ⏱️ PASO 3: POST-REGISTRO

### A. Verificación de Amazon (24-72 horas)

Después de registrarte:
1. Amazon revisará tu aplicación manualmente
2. Recibirás un email en 24-72 horas con el resultado
3. **IMPORTANTE**: Debes generar al menos 3 ventas calificadas en los primeros 180 días

### B. Actualizar el Código con tu Associate ID Real

Una vez aprobado, actualiza el archivo:
```typescript
// supabase/functions/generate-external-affiliate-link/index.ts

const WINCOVA_AFFILIATE_CODES = {
  amazon: 'wincova-20', // ← REEMPLAZA con tu ID real (ej: 'wincovacorp-20')
  walmart: 'wincova',
  target: 'wincova',
  ebay: 'wincova',
  etsy: 'wincova',
};
```

### C. Instalar Site Stripe (Requerido por Amazon)

Amazon requiere que muestres disclosure de afiliado. Agrega esto en tu footer:

```html
<!-- Footer de wincova.com -->
<p class="text-xs text-muted-foreground">
  Como afiliado de Amazon, Wincova recibe una comisión por compras calificadas 
  realizadas a través de enlaces en este sitio.
</p>
```

---

## 📊 PASO 4: TRACKING DE PERFORMANCE

### A. Dashboard de Amazon Associates

Accede a: **https://affiliate-program.amazon.com/home**

Métricas clave a monitorear:
- **Clicks**: Cuántas personas hicieron clic en tus links
- **Ordered Items**: Productos pedidos dentro de la ventana de 24h
- **Shipped Items**: Productos enviados (comisión confirmada)
- **Conversion Rate**: % de clicks que se convierten en ventas
- **Earnings**: Comisiones ganadas

### B. Metas para los Primeros 180 Días

Para mantener tu cuenta activa:
- ✅ **Mínimo 3 ventas calificadas** en 180 días
- Objetivo conservador: 10-20 ventas/mes
- Revenue proyectado: $50-200/mes inicialmente

---

## 🚨 REGLAS CRÍTICAS DE AMAZON ASSOCIATES

**NUNCA HAGAS ESTO (Te banearán):**

❌ **Auto-Clicking**: No hagas clic en tus propios links de afiliado
❌ **Incentivos**: No ofrezcas cash-back o descuentos por comprar a través de tu link
❌ **Email Spam**: No envíes links de afiliado en emails masivos no solicitados
❌ **Ocultar Links**: No uses acortadores de URLs (bit.ly, etc.)
❌ **Precio Falso**: No digas "precio especial" si no lo es

✅ **SIEMPRE HAZ ESTO:**

✅ **Disclosure Claro**: Informa que usas links de afiliado
✅ **Contenido Original**: Tus recomendaciones deben ser genuinas
✅ **Links Directos**: Usa links de Amazon directamente (ya lo haces bien)
✅ **Actualizar Links**: Si un producto ya no está disponible, remueve el link

---

## 💡 PRÓXIMOS PASOS DESPUÉS DE APROBACIÓN

### Semana 1: Setup Completo
- [ ] Recibir aprobación de Amazon (24-72h)
- [ ] Actualizar código con Associate ID real
- [ ] Agregar disclosure en footer
- [ ] Hacer primera venta de prueba

### Semana 2: Optimización
- [ ] Monitorear analytics diarios
- [ ] Probar diferentes productos en AI recommendations
- [ ] Identificar categorías con mejor conversion rate
- [ ] Ajustar copy del AI basado en performance

### Semana 3: Escalamiento
- [ ] Implementar email marketing con links de afiliado
- [ ] Crear contenido de blog con recomendaciones
- [ ] Agregar retargeting en Product Preview Modal
- [ ] Lanzar campaña de ads dirigiendo a GiftApp

---

## 🎯 PROYECCIÓN DE REVENUE (Conservadora)

### Mes 1-3 (Fase de Tracción):
- 500 usuarios/mes
- 5% click-through rate = 25 clicks
- 3% conversion = 0.75 ventas
- $50 valor promedio × 5% comisión = **$1.87/venta**
- **Revenue Mes 1: ~$50/mes**

### Mes 4-6 (Fase de Crecimiento):
- 2,000 usuarios/mes
- 7% CTR = 140 clicks
- 4% conversion = 5.6 ventas
- **Revenue Mes 6: ~$300/mes**

### Mes 7-12 (Fase de Escalamiento):
- 5,000 usuarios/mes
- 10% CTR = 500 clicks
- 5% conversion = 25 ventas
- **Revenue Mes 12: ~$1,250/mes** ($15K/año)

---

## 📞 SOPORTE

Si tienes problemas durante el registro:

- **Amazon Associates Support**: https://affiliate-program.amazon.com/help/contact
- **Phone**: 1-866-216-1072 (USA)
- **Email**: associates@amazon.com

---

## ✅ CHECKLIST FINAL

Antes de enviar tu aplicación, verifica:

- [ ] Email corporativo configurado (no personal)
- [ ] EIN de Wincova Corporation disponible
- [ ] Dirección de Tennessee confirmada
- [ ] Descripción del sitio en inglés revisada
- [ ] Método de pago (bank account) listo
- [ ] Número de teléfono para verificación activo
- [ ] wincova.com funcionando y accesible públicamente

---

**🚀 ACCIÓN INMEDIATA:** 

Ve a **https://affiliate-program.amazon.com/** y completa el registro **HOY MISMO**.

El setup técnico ya está listo. Solo falta tu aprobación para empezar a ganar comisiones.

---

**Tiempo estimado de registro:** 15-20 minutos  
**Tiempo de aprobación:** 24-72 horas  
**Primera comisión:** 30-60 días después de tu primera venta

¡Suerte! 🎉
