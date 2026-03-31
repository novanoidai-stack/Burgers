# 🧠 MEMORY - Decisiones Técnicas y Lecciones

**Propósito**: Registro de decisiones arquitectónicas y lecciones aprendidas para evitar repetir errores y mantener coherencia técnica a lo largo del proyecto.

---

## 📌 Decisiones Tomadas

### 0. **Backend Language: Node.js + TypeScript**
**Fecha**: 2026-03-31
**Decisión**: Usar **Node.js + TypeScript** como lenguaje principal del backend.

**Por Qué**:
- WebSockets: Mejor ecosistema (socket.io, ws) para audio bidireccional con Twilio
- Latencia: Menor overhead que Python/FastAPI para streaming de audio
- SDKs: Twilio, Anthropic, Deepgram, ElevenLabs, Stripe tienen SDKs de primera clase
- Velocidad de desarrollo: TypeScript da seguridad de tipos sin sacrificar velocidad

**Alternativa Rechazada**: Python + FastAPI (aceptable pero overhead mayor en audio streaming)

**Registrado**: Decisión tomada el último día antes de Sprint 1 (2026-03-31 23:59)

**Referencia**: `tech_stack.md` se actualiza con comandos Node.js/TypeScript

---

### 1. **Motor de Voz: Twilio SIP + Deepgram + ElevenLabs (No Vapi.ai)**
**Fecha**: 2026-03-31
**Decisión**: Arquitectura de **control total** sobre voz en lugar de Vapi.ai.

**Componentes**:
- **Twilio SIP**: Solo transporte de audio (sin Twilio Studio)
- **Deepgram**: STT en tiempo real (~200ms) con VAD built-in (<50ms)
- **ElevenLabs Turbo**: TTS (~300-400ms)
- **WebSocket**: Comunicación bidireccional servidor ↔ cliente

**Por Qué NO Vapi.ai**:
- Costo 3-5x más alto ($0.05-0.10/min vs $0.01-0.015/min)
- VAD limitado a configuración Vapi (no personalizable)
- Latencia 1.5-2s vs ~1.2s con control total
- Menos control sobre interrupciones de usuario

**Latencia Total Estimada**: STT 200ms + LLM 600ms + TTS 400ms + overhead 100ms = **~1.3s** ✅

**Implicación de Sprint 1**: Más trabajo en Sprint 2 (7 días vs 2 días) pero arquitectura sólida para producción

**Referencia**: `tech_stack.md` (sección Motor de Voz)

---

### 2. **Arquitectura de Canales: Normalización en Entrada**
**Fecha**: 2026-03-30
**Decisión**: Ambos canales (Voz + WhatsApp) convergen en un **orquestador centralizado** antes de llegar al LLM.

**Por Qué**:
- Evita lógica duplicada
- Un único "sistema nervioso" para procesar pedidos
- Facilita testing y debugging
- Permite cambiar modelos de IA sin tocar los canales

**Implicación**:
- El servidor debe parsear tanto audio → texto como texto → entendimiento
- Los webhooks de Twilio y Meta llegan a endpoints diferentes pero se mapean a la misma estructura interna

**Referencia**: `tech_stack.md` (Sección "Capa de Entrada")

---

### 2. **Speech Processing: Deepgram + ElevenLabs (No OpenAI Realtime)**
**Fecha**: 2026-03-30
**Decisión**: Usar **Deepgram** para STT y **ElevenLabs Turbo** para TTS, en lugar de OpenAI Realtime API.

**Por Qué**:
- OpenAI Realtime está en beta y tiene limitaciones de rate limiting
- Deepgram es más barato (~$0.005 por minuto) que Realtime
- ElevenLabs Turbo tiene la latencia más baja del mercado (~300-400ms)
- Más control granular sobre VAD y cancelación de voz

**Riesgo Aceptado**:
- Overhead de coordinación entre servicios
- Potencial aumento de latencia si los servicios no están optimizados

**Plan B**: Si Deepgram se queda corto, cambiar a OpenAI Realtime (costo: 2 días de refactoring)

**Referencia**: `tech_stack.md` (Sección "Motor de Voz")

---

### 3. **Integración TPV: Estrategia de Adaptadores**
**Fecha**: 2026-03-30
**Decisión**: Crear una **interfaz `TPVAdapter` común** con implementaciones específicas por TPV.

**Por Qué**:
- Cada TPV (Revo, Square, Toast) tiene APIs completamente diferentes
- Mejor escalabilidad: agregar nuevo TPV = nueva clase que implementa interfaz
- Permite testing sin dependencia del TPV real

**Estructura Esperada**:
```typescript
interface TPVAdapter {
  name: string;
  transformOrder(order: Order): TPVFormat;
  submitOrder(order: TPVFormat): Promise<TPVResponse>;
  getInventory(): Promise<Inventory>;
}
```

**Plan B (Si API no existe)**: Crear agente local que inyecta datos en BD del TPV legacy

**Referencia**: `tech_stack.md` (Sección "Integración TPV")

---

### 4. **Base de Datos: PostgreSQL (vía Supabase) en MVP**
**Fecha**: 2026-03-30
**Decisión**: Usar **Supabase** (PostgreSQL managed) en MVP, no Redis ni bases NoSQL.

**Por Qué**:
- Transacciones ACID para pago + confirmación TPV
- Queries SQL nativas para reportes analíticos
- Supabase es más barato que alternatives managed en MVP
- Built-in authentication y realtime capabilities

**No usamos NoSQL porque**:
- Los pedidos tienen relaciones (cliente → pedido → items)
- Necesitamos garantías de consistencia (pago ≠ enviado a TPV)

**Migración futura**: Si llegamos a 10k+ pedidos/día, agregar Redis para estado de sesiones activas

**Referencia**: `tech_stack.md` (Sección "Capa de Datos")

---

### 5. **Pagos: Stripe como Standard, Mercado Pago como Alternativa**
**Fecha**: 2026-03-30
**Decisión**: Integración primary con **Stripe**, soporte secondary para **Mercado Pago** (LATAM).

**Por Qué**:
- Stripe tiene mejor documentación y SDKs
- Webhooks más confiables
- Mercado Pago está incluido para mercados LATAM

**Regla de Oro**:
> **EL PEDIDO NO LLEGA A LA COCINA HASTA QUE STRIPE CONFIRMA EL PAGO**

Esto se implementa con un webhook listener que valida `payment.succeeded` antes de POST al TPV.

**Referencia**: `roadmap.md` (Sprint 4) + `tech_stack.md` (Sección "Pagos")

---

### 6. **Voz: Full Duplex + VAD (Capacidad de Interrupción)**
**Fecha**: 2026-03-30
**Decisión**: Sistema de voz debe permitir que el usuario interrumpa a la IA **en tiempo real**.

**Por Qué**:
- Las conversaciones naturales requieren interrupciones
- VAD detecta inicio de habla del cliente → cancel output de IA
- Latencia < 50ms es crítica para que se sienta natural

**Tecnología**:
- Deepgram VAD (built-in)
- WebSocket handler que monitorea ambos streams (entrada/salida)
- Signal de cancelación enviada a ElevenLabs

**Riesgo**: Si VAD falla, la IA podría hablar sin parar → Monitoreo estricto en Sprint 2

**Referencia**: `tech_stack.md` (Sección "Motor de Voz") + `roadmap.md` (Sprint 2)

---

### 7. **Arquitectura de Monitoreo: Logging Centralizado**
**Fecha**: 2026-03-30
**Decisión**: **Winston** (Node) o **Python logging** → **Datadog** para todos los eventos.

**Por Qué**:
- Visibilidad en tiempo real de errores
- Trazabilidad completa de un pedido desde voz → pago → TPV
- Alertas automáticas si latencia > 1.5s

**Métricas Clave**:
- Latencia STT + LLM + TTS
- Tasa de error de integración TPV
- Uptime del servidor

**Referencia**: `tech_stack.md` (Sección "Monitoreo")

---

## 🚫 Decisiones **RECHAZADAS** (No Repetir)

### ❌ OpenAI Realtime API como primary
**Por qué no**: En beta, rate limits agresivos, precio más alto. Revisitar en Q3 2026 si Deepgram falla.

### ❌ NoSQL (MongoDB) para base de datos
**Por qué no**: Pedidos requieren transacciones ACID. SQL es mejor.

### ❌ Twilio Studio (flujos visuales) para lógica de voz
**Por qué no**: No escalable. Necesitamos código versionable en Git. Usar Twilio solo como "transportista".

### ❌ Integración manual con cada TPV (sin adaptador)
**Por qué no**: Code smell. Cada cliente = nueva ramificación de código. Patrón adapter es mejor.

### ❌ Almacenar grabaciones de audio en PostgreSQL
**Por qué no**: BLOB en BD es anti-patrón. Usar S3 / Supabase Storage en Sprint 4.

---

## 📊 Matriz de Decisiones Pendientes

| Decisión | Opciones | Criterio | Deadline | Owner |
|----------|----------|----------|----------|-------|
| **Backend Language** | Node.js vs Python | Performance vs Devops | 2026-03-31 | Arquitecto |
| **Frontend Framework** | Next.js vs React+Vite | Dashboard interactivo | 2026-04-05 | DEV 1 |
| **KDS Necesario?** | Propio vs Adaptar TPV | Test con cliente piloto | 2026-04-10 | Arquitecto |
| **Redis para Cache?** | Sí vs No | Si latencia LLM > 800ms | 2026-04-15 | DEV 3 |

---

## 💾 Lecciones Aprendidas (De Proyectos Similares)

### 1. **La Latencia es Rey**
Usuarios esperan < 1.5s. Si la respuesta tarda > 2s, sienten que el sistema "piensa demasiado". Esto rompe la ilusión de conversación natural.

**Acción**: Testing de latencia en Sprint 2, no en Sprint 4.

### 2. **Los TPVs Legacy Son Impredecibles**
Cada software de Windows 7 es único. No asumir que existe documentación.

**Acción**: Contactar con cliente piloto TEMPRANO, obtener acceso directo a su BD.

### 3. **Las Interrupciones en Voz Son Críticas**
Si la IA no se detiene cuando el usuario habla, la UX es terrible.

**Acción**: Implementar VAD en Sprint 2, testing destructivo en Sprint 4.

### 4. **Stripe Webhooks > Polling**
No hacer polling de estado de pagos. Stripe envía webhooks instantáneamente. Si no recibes webhook, hay problema de red.

**Acción**: Implementar listener robusto, reintentos automáticos.

### 5. **El Menú Cambia Constantemente**
Restaurantes cambian precios/disponibilidad a diario. El System Prompt debe ser dinámico (consultar BD cada X minutos).

**Acción**: No hardcodear menú. Usar RAG con tabla `productos` en BD.

---

## 🔗 Referencias Cruzadas

**Roadmap**: `roadmap.md` — Qué hacemos, cuándo, en qué orden
**Tech Stack**: `tech_stack.md` — Con qué tecnologías
**Estado Actual**: `current.md` — Dónde estamos ahora, qué falta
**Memoria** (ESTE ARCHIVO) — Por qué decidimos cada cosa

---

## 📝 Plantilla para Nuevas Decisiones

Cuando tomes una decisión importante durante el desarrollo, registra aquí:

```markdown
### N. **[TÍTULO DE DECISIÓN]**
**Fecha**: YYYY-MM-DD
**Decisión**: [Qué decidimos hacer]

**Por Qué**:
- Razón 1
- Razón 2
- Razón 3

**Implicación**:
- Cambio 1 en arquitectura
- Cambio 2 en testing

**Riesgo Aceptado**: [Si lo hay]

**Plan B**: [Si falla, qué hacemos]

**Referencia**: [Dónde aparece en roadmap/tech_stack]
```

---

## 🎯 Próxima Actualización

Después de **Sprint 1 (7 de abril 2026)**, revisar y agregar:
- Decisiones tomadas durante implementación
- Problemas encontrados
- Ajustes necesarios al roadmap
