# Flujo Visual del Sistema de Correcciones Automáticas

## 🎨 Diagrama de Flujo Completo

```mermaid
graph TB
    Start([Developer hace Push]) --> GitHub[GitHub Repository]
    GitHub --> Webhook{GitHub Webhook<br/>Configurado?}
    Webhook -->|No| ConfigWebhook[Configurar Webhook]
    ConfigWebhook --> GitHub
    Webhook -->|Si| EdgeFunction[github-audit-webhook<br/>Edge Function]
    
    EdgeFunction --> DownloadFiles[Descargar archivos<br/>modificados del commit]
    DownloadFiles --> OpenAI[Enviar a OpenAI<br/>GPT-4o-mini]
    OpenAI --> Analysis[Análisis de Código]
    Analysis --> SaveDB[(Guardar en ai_corrections<br/>Status: pending)]
    
    SaveDB --> AdminUI[UI Admin:<br/>/admin/corrections]
    AdminUI --> ReviewTab[Tab: Pendientes]
    
    ReviewTab --> AdminDecision{Admin<br/>Revisa}
    AdminDecision -->|Aprobar| Approved[(Status: approved)]
    AdminDecision -->|Rechazar| Rejected[(Status: rejected)]
    
    Approved --> CopyCommand[Admin click:<br/>Copiar Comando]
    CopyCommand --> Clipboard[Comando en<br/>Portapapeles]
    Clipboard --> AIChat[Pegar en Chat<br/>de Lovable/Replit/etc]
    
    AIChat --> GetAPI[AI Agent:<br/>GET /get-approved-corrections]
    GetAPI --> ParseJSON[Parsear JSON<br/>de correcciones]
    ParseJSON --> ApplyLoop{Para cada<br/>corrección}
    
    ApplyLoop --> ReadFile[Leer archivo]
    ReadFile --> ReplaceCode[Reemplazar<br/>current_code con<br/>suggested_code]
    ReplaceCode --> WriteFile[Escribir archivo]
    WriteFile --> ApplyLoop
    
    ApplyLoop --> AllDone{Todas<br/>aplicadas?}
    AllDone -->|No| ApplyLoop
    AllDone -->|Si| MarkAPI[AI Agent:<br/>POST /mark-corrections-applied]
    
    MarkAPI --> UpdateDB[(Update ai_corrections<br/>Status: applied)]
    UpdateDB --> GitPush[Git Push de<br/>correcciones aplicadas]
    GitPush --> GitHub
    
    Rejected --> End([Fin])
    UpdateDB --> End
    
    style Start fill:#e1f5ff
    style GitHub fill:#ff9800
    style EdgeFunction fill:#4caf50
    style OpenAI fill:#9c27b0
    style SaveDB fill:#2196f3
    style AdminUI fill:#00bcd4
    style Approved fill:#8bc34a
    style Rejected fill:#f44336
    style AIChat fill:#ff5722
    style UpdateDB fill:#4caf50
    style End fill:#e1f5ff
```

---

## 🔄 Ciclo Completo en Detalle

### Fase 1: Detección Automática (0-60 segundos)

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant WH as Webhook Handler
    participant AI as OpenAI API
    participant DB as Supabase DB
    
    Dev->>GH: git push origin main
    GH->>WH: POST /github-audit-webhook
    WH->>GH: Descargar archivos modificados
    GH-->>WH: Contenido de archivos
    WH->>AI: Analizar código
    AI-->>WH: Lista de correcciones
    WH->>DB: INSERT INTO ai_corrections
    DB-->>WH: Correcciones guardadas
    WH-->>GH: 200 OK
```

**Tiempo estimado:** 30-60 segundos

---

### Fase 2: Revisión Manual (Tiempo variable)

```mermaid
stateDiagram-v2
    [*] --> Pendientes: Nueva corrección
    Pendientes --> AdminRevisa: Admin abre UI
    AdminRevisa --> VerCodigo: Click en corrección
    VerCodigo --> Decision: Analiza código
    Decision --> Aprobar: Cambio válido
    Decision --> Rechazar: Cambio inválido
    Aprobar --> Aprobadas: Status = approved
    Rechazar --> Rechazadas: Status = rejected
    Aprobadas --> [*]: Listo para aplicar
    Rechazadas --> [*]: Descartado
```

**Tiempo estimado:** 1-5 minutos por corrección

---

### Fase 3: Aplicación Automática (1-2 minutos)

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant UI as Admin UI
    participant Clip as Clipboard
    participant Chat as Lovable Chat
    participant API as Edge Functions
    participant FS as File System
    participant DB as Database
    
    Admin->>UI: Click "Copiar Comando"
    UI->>Clip: Copiar texto
    Admin->>Chat: Pegar comando
    Chat->>API: GET /get-approved-corrections
    API-->>Chat: JSON con correcciones
    
    loop Para cada corrección
        Chat->>FS: Leer archivo
        FS-->>Chat: Contenido
        Chat->>Chat: Reemplazar código
        Chat->>FS: Escribir archivo
        FS-->>Chat: Guardado
    end
    
    Chat->>API: POST /mark-corrections-applied
    API->>DB: UPDATE ai_corrections
    DB-->>API: Actualizado
    API-->>Chat: Confirmación
    Chat-->>Admin: ✅ X correcciones aplicadas
```

**Tiempo estimado:** 1-2 minutos para 10-20 correcciones

---

## 📊 Estados y Transiciones

```mermaid
stateDiagram-v2
    [*] --> pending: Webhook detecta problema
    pending --> approved: Admin aprueba
    pending --> rejected: Admin rechaza
    approved --> applied: AI Agent aplica
    applied --> [*]: Push a GitHub
    rejected --> [*]: Descartado
    
    note right of pending
        Color: 🟡 Amarillo
        Acción: Esperando revisión
    end note
    
    note right of approved
        Color: 🟢 Verde
        Acción: Listo para aplicar
    end note
    
    note right of rejected
        Color: 🔴 Rojo
        Acción: Descartado
    end note
    
    note right of applied
        Color: ✅ Verde oscuro
        Acción: Ya aplicado
    end note
```

---

## 🎯 Puntos de Decisión

### ¿Cuándo aprobar una corrección?

```mermaid
flowchart TD
    Start{Nueva Corrección} --> Critica{Es Crítica?}
    Critica -->|Sí| SecurityCheck{Afecta<br/>Seguridad?}
    Critica -->|No| Important{Es Importante?}
    
    SecurityCheck -->|Sí| Approve[✅ APROBAR]
    SecurityCheck -->|No| DataCheck{Afecta<br/>Datos?}
    
    DataCheck -->|Sí| Approve
    DataCheck -->|No| Important
    
    Important -->|Sí| LogicCheck{Rompe<br/>Lógica?}
    Important -->|No| Suggest{Es Sugerencia?}
    
    LogicCheck -->|Sí| Reject[❌ RECHAZAR]
    LogicCheck -->|No| Approve
    
    Suggest -->|Mejora UX| Approve
    Suggest -->|Mejora Código| Review[📝 Revisar Manual]
    Suggest -->|Cambio Estético| Optional[🤔 Opcional]
    
    Review --> Approve
    Optional --> Approve
    Optional --> Reject
    
    style Approve fill:#4caf50,color:#fff
    style Reject fill:#f44336,color:#fff
    style Review fill:#ff9800,color:#fff
    style Optional fill:#ffc107,color:#000
```

---

## 🚦 Semáforo de Severidad

```mermaid
graph LR
    A[Correcciones] --> B{Severidad}
    B -->|Critical| C[🔴 URGENTE<br/>Aplicar en < 1 hora]
    B -->|Important| D[🟡 PRIORITARIO<br/>Aplicar en < 24 horas]
    B -->|Suggestion| E[🔵 OPCIONAL<br/>Aplicar cuando sea posible]
    
    C --> F[Ejemplos:<br/>- Vulnerabilidades<br/>- Bugs críticos<br/>- Pérdida de datos]
    D --> G[Ejemplos:<br/>- Validaciones faltantes<br/>- Errores sin manejar<br/>- Tipos incorrectos]
    E --> H[Ejemplos:<br/>- Mejoras de código<br/>- Optimizaciones<br/>- Refactoring]
    
    style C fill:#f44336,color:#fff
    style D fill:#ff9800,color:#fff
    style E fill:#2196f3,color:#fff
```

---

## 📈 Métricas del Sistema

### Dashboard Visual

```mermaid
pie title Distribución de Correcciones por Estado
    "Pendientes" : 30
    "Aprobadas" : 15
    "Aplicadas" : 45
    "Rechazadas" : 10
```

### Embudo de Conversión

```mermaid
funnel
    title Embudo de Correcciones
    "Detectadas (100)" : 100
    "Revisadas (80)" : 80
    "Aprobadas (60)" : 60
    "Aplicadas (55)" : 55
```

---

## 🔄 Flujo de Rollback

### Si una corrección rompe algo:

```mermaid
flowchart TD
    Error[❌ Error Detectado] --> Identify{Identificar<br/>Corrección}
    Identify --> RevertCode[Git Revert del Commit]
    RevertCode --> UpdateDB[Actualizar DB:<br/>Status = rejected]
    UpdateDB --> AddNotes[Agregar Notas:<br/>Por qué se revirtió]
    AddNotes --> Notify[Notificar al<br/>Equipo]
    Notify --> ImprovePrompt[Mejorar Prompt<br/>de Análisis]
    ImprovePrompt --> End[✅ Resuelto]
    
    style Error fill:#f44336,color:#fff
    style End fill:#4caf50,color:#fff
```

---

## 🎨 Interfaz de Usuario

### Vista de Corrección Individual

```
┌─────────────────────────────────────────────────────────┐
│ 🔴 Falta de manejo de errores en fetchCorrections       │
├─────────────────────────────────────────────────────────┤
│ src/pages/AdminCorrections.tsx : Línea 36               │
├─────────────────────────────────────────────────────────┤
│ La función fetchCorrections no tiene manejo de errores, │
│ lo que puede causar que la aplicación falle...          │
├─────────────────────────────────────────────────────────┤
│ Código Actual:                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ const fetchCorrections = async () => {              │ │
│ │   const { data, error } = await supabase            │ │
│ │     .from('ai_corrections')                         │ │
│ │     .select('*')                                    │ │
│ │ }                                                   │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Código Sugerido:                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ const fetchCorrections = async () => {              │ │
│ │   try {                                             │ │
│ │     const { data, error } = await supabase          │ │
│ │       .from('ai_corrections')                       │ │
│ │       .select('*')                                  │ │
│ │     if (error) throw error                          │ │
│ │   } catch (error) {                                 │ │
│ │     toast({ title: 'Error', description: '...' })   │ │
│ │   }                                                 │ │
│ │ }                                                   │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  [Aprobar]  [Rechazar]  [Copiar]                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Timeline de Eventos

```mermaid
gantt
    title Timeline Típico de una Corrección
    dateFormat  HH:mm:ss
    
    section Detección
    Push a GitHub       :a1, 00:00:00, 5s
    Webhook triggered   :a2, after a1, 5s
    OpenAI Analysis     :a3, after a2, 30s
    Save to DB          :a4, after a3, 5s
    
    section Revisión
    Admin abre UI       :b1, after a4, 60s
    Revisa corrección   :b2, after b1, 120s
    Aprueba             :b3, after b2, 10s
    
    section Aplicación
    Copia comando       :c1, after b3, 5s
    Pega en chat        :c2, after c1, 10s
    AI aplica cambios   :c3, after c2, 60s
    Marca como aplicada :c4, after c3, 5s
```

---

## 🔗 Arquitectura de Integración

```mermaid
C4Context
    title Contexto del Sistema de Correcciones

    Person(admin, "Administrador", "Revisa y aprueba<br/>correcciones")
    Person(dev, "Developer", "Hace cambios<br/>al código")
    
    System_Boundary(wincova, "Sistema Wincova") {
        System(ui, "Admin UI", "Interfaz web para<br/>revisar correcciones")
        System(api, "Edge Functions", "APIs para obtener<br/>y marcar correcciones")
        System(db, "Supabase DB", "Base de datos con<br/>correcciones")
    }
    
    System_Ext(github, "GitHub", "Control de versiones")
    System_Ext(openai, "OpenAI", "Análisis de código<br/>con GPT-4o-mini")
    System_Ext(lovable, "Lovable AI", "Agente que aplica<br/>correcciones")
    
    Rel(dev, github, "Hace push")
    Rel(github, api, "Webhook event")
    Rel(api, openai, "Analiza código")
    Rel(api, db, "Guarda correcciones")
    Rel(admin, ui, "Revisa y aprueba")
    Rel(ui, db, "Lee/actualiza")
    Rel(lovable, api, "Obtiene correcciones")
    Rel(lovable, github, "Aplica cambios")
```

---

## 📱 Responsive Flow

### Desktop View

```
┌─────────────────────────────────────────────────────────────┐
│  Correcciones AI                                             │
├─────────────────────────────────────────────────────────────┤
│  [Pendientes (16)] [Aprobadas (0)] [Rechazadas (0)] [...] │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🔴 Corrección 1                      [Aprobar][...]  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🟡 Corrección 2                      [Aprobar][...]  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile View

```
┌────────────────┐
│ Correcciones AI│
├────────────────┤
│ [☰] Tabs       │
├────────────────┤
│ ┌────────────┐ │
│ │ 🔴 Corr. 1 │ │
│ │ [Ver más]  │ │
│ └────────────┘ │
│ ┌────────────┐ │
│ │ 🟡 Corr. 2 │ │
│ │ [Ver más]  │ │
│ └────────────┘ │
└────────────────┘
```

---

**Última actualización:** 2025-11-17  
**Versión:** 1.0.0  
**Tipo:** Documentación Visual
