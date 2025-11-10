# Edge Functions API Documentation

**Fix #09: Add comprehensive Edge Functions API documentation**

Esta documentación describe las funciones serverless (Edge Functions) disponibles en GiftApp, sus endpoints, parámetros, respuestas y ejemplos de uso.

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Autenticación](#autenticación)
3. [Funciones Disponibles](#funciones-disponibles)
   - [search-products](#search-products)
   - [suggest-gift](#suggest-gift)
4. [Códigos de Error](#códigos-de-error)
5. [Rate Limiting](#rate-limiting)
6. [Ejemplos de Integración](#ejemplos-de-integración)

---

## Visión General

Las Edge Functions de GiftApp se ejecutan en Supabase Edge Runtime (Deno) y proporcionan funcionalidad serverless escalable. Todas las funciones están desplegadas en:

```
https://ghbksqyioendvispcseu.supabase.co/functions/v1/
```

**Características:**
- 🚀 **Latencia baja**: Ejecución global en edge locations
- 🔒 **Seguras**: Autenticación JWT requerida por defecto
- 📊 **Observables**: Logs centralizados y monitoring
- 🔄 **Auto-escalables**: Manejo automático de tráfico

---

## Autenticación

La mayoría de las funciones requieren autenticación JWT. Incluye el token en el header `Authorization`:

```javascript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(`${SUPABASE_URL}/functions/v1/function-name`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ /* params */ }),
});
```

**Usando el cliente de Supabase (recomendado):**

```javascript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* params */ },
});
```

---

## Funciones Disponibles

### search-products

Busca productos en APIs externas (Amazon, eBay, AliExpress) basándose en query del usuario.

#### Endpoint
```
POST /functions/v1/search-products
```

#### Autenticación
✅ Requerida

#### Parámetros (Body JSON)

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `query` | string | ✅ | Término de búsqueda (ej: "laptop gaming") |
| `category` | string | ❌ | Filtro de categoría (ej: "tech", "fashion") |
| `maxResults` | number | ❌ | Máximo de resultados (default: 10, max: 50) |
| `minPrice` | number | ❌ | Precio mínimo en USD |
| `maxPrice` | number | ❌ | Precio máximo en USD |

#### Respuesta Exitosa (200)

```json
{
  "products": [
    {
      "id": "prod_abc123",
      "title": "Laptop Gaming ASUS ROG",
      "description": "15.6 pulgadas, RTX 3060, 16GB RAM",
      "price": 1299.99,
      "currency": "USD",
      "imageUrl": "https://...",
      "productUrl": "https://...",
      "source": "amazon",
      "rating": 4.5,
      "reviewCount": 234
    }
  ],
  "totalResults": 156,
  "hasMore": true
}
```

#### Errores

- **400 Bad Request**: Falta parámetro `query` o inválido
- **401 Unauthorized**: Token JWT inválido o faltante
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Error en API externa

#### Ejemplo de Uso

```typescript
import { supabase } from '@/integrations/supabase/client';

const searchProducts = async (query: string) => {
  const { data, error } = await supabase.functions.invoke('search-products', {
    body: {
      query,
      category: 'tech',
      maxResults: 20,
      maxPrice: 2000,
    },
  });

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return data.products;
};

// Uso
const products = await searchProducts('wireless headphones');
```

#### cURL Example

```bash
curl -X POST \
  'https://ghbksqyioendvispcseu.supabase.co/functions/v1/search-products' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "smart watch",
    "category": "tech",
    "maxResults": 10
  }'
```

---

### suggest-gift

Genera sugerencias de regalos personalizadas usando IA basándose en perfil del destinatario.

#### Endpoint
```
POST /functions/v1/suggest-gift
```

#### Autenticación
✅ Requerida

#### Parámetros (Body JSON)

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `recipientProfile` | object | ✅ | Perfil del destinatario |
| `recipientProfile.age` | number | ❌ | Edad del destinatario |
| `recipientProfile.gender` | string | ❌ | Género (male/female/other) |
| `recipientProfile.interests` | string[] | ✅ | Intereses (min: 1, max: 10) |
| `recipientProfile.relationship` | string | ❌ | Relación (friend/family/partner/colleague) |
| `occasion` | string | ✅ | Ocasión (birthday/christmas/anniversary/etc) |
| `budget` | object | ❌ | Presupuesto |
| `budget.min` | number | ❌ | Presupuesto mínimo |
| `budget.max` | number | ❌ | Presupuesto máximo |
| `numberOfSuggestions` | number | ❌ | Cantidad de sugerencias (default: 5, max: 10) |

#### Respuesta Exitosa (200)

```json
{
  "suggestions": [
    {
      "id": "sugg_xyz789",
      "title": "Cámara Instantánea Fujifilm",
      "description": "Perfecta para alguien que ama la fotografía y los momentos espontáneos",
      "reasoning": "Basado en su interés en fotografía y viajes, una cámara instantánea captura recuerdos al momento",
      "estimatedPrice": 89.99,
      "category": "tech",
      "matchScore": 0.92,
      "tags": ["photography", "travel", "creative"]
    }
  ],
  "totalSuggestions": 5,
  "profileSummary": "Persona creativa de 28 años interesada en fotografía, viajes y música"
}
```

#### Errores

- **400 Bad Request**: Parámetros inválidos o faltantes
- **401 Unauthorized**: Token JWT inválido
- **429 Too Many Requests**: Rate limit excedido (máx: 10 requests/minuto)
- **500 Internal Server Error**: Error en servicio de IA

#### Ejemplo de Uso

```typescript
import { supabase } from '@/integrations/supabase/client';

const getSuggestions = async () => {
  const { data, error } = await supabase.functions.invoke('suggest-gift', {
    body: {
      recipientProfile: {
        age: 28,
        gender: 'female',
        interests: ['photography', 'travel', 'music', 'cooking'],
        relationship: 'friend',
      },
      occasion: 'birthday',
      budget: {
        min: 50,
        max: 150,
      },
      numberOfSuggestions: 5,
    },
  });

  if (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }

  return data.suggestions;
};

// Uso
const suggestions = await getSuggestions();
```

#### cURL Example

```bash
curl -X POST \
  'https://ghbksqyioendvispcseu.supabase.co/functions/v1/suggest-gift' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientProfile": {
      "age": 28,
      "interests": ["photography", "travel", "music"],
      "relationship": "friend"
    },
    "occasion": "birthday",
    "budget": {
      "min": 50,
      "max": 150
    },
    "numberOfSuggestions": 5
  }'
```

---

## Códigos de Error

| Código | Significado | Acción Recomendada |
|--------|-------------|-------------------|
| 400 | Bad Request | Verificar parámetros enviados |
| 401 | Unauthorized | Renovar token de autenticación |
| 403 | Forbidden | Usuario no tiene permisos |
| 404 | Not Found | Verificar nombre de función |
| 429 | Too Many Requests | Implementar backoff exponencial |
| 500 | Internal Server Error | Reintentar o contactar soporte |
| 503 | Service Unavailable | API externa no disponible, reintentar |

### Formato de Error

```json
{
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "details": { /* información adicional */ }
  }
}
```

---

## Rate Limiting

**Límites por función:**

| Función | Límite | Ventana |
|---------|--------|---------|
| search-products | 30 requests | 1 minuto |
| suggest-gift | 10 requests | 1 minuto |

**Headers de respuesta:**

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1699564800
```

**Cuando se excede el límite:**

```json
{
  "error": {
    "message": "Rate limit exceeded. Please try again in 45 seconds.",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 45
  }
}
```

---

## Ejemplos de Integración

### React Hook Personalizado

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEdgeFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = async (query: string, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'search-products',
        {
          body: { query, ...filters },
        }
      );

      if (functionError) throw functionError;
      return data.products;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async (profile, occasion, budget) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'suggest-gift',
        {
          body: {
            recipientProfile: profile,
            occasion,
            budget,
          },
        }
      );

      if (functionError) throw functionError;
      return data.suggestions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    searchProducts,
    getSuggestions,
    loading,
    error,
  };
};
```

### Manejo de Errores con Retry

```typescript
const callWithRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // No reintentar en errores 4xx (excepto 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      
      // Backoff exponencial
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Uso
const products = await callWithRetry(() =>
  supabase.functions.invoke('search-products', {
    body: { query: 'laptop' },
  })
);
```

---

## Soporte y Contacto

Para reportar issues o solicitar nuevas funciones:
- **Email**: dev@giftapp.com
- **GitHub Issues**: [Reportar issue](#)
- **Documentación**: [docs.giftapp.com](#)

**Última actualización:** 10 de noviembre de 2025  
**Versión de la API:** 1.0.0
