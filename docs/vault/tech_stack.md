# 🛠️ TECH STACK - Burger-AI

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND / CANALES                   │
├─────────────────────────────────────────────────────────┤
│  WhatsApp Business API  │  Twilio SIP  │  Web Dashboard  │
└────────────────┬────────────────────────┬────────────────┘
                 │                        │
                 └────────────┬───────────┘
                              │
                    ┌─────────▼──────────┐
                    │  API Gateway       │
                    │  (Node.js/Python)  │
                    └────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────────┐
│   LLM Engine   │  │ Speech Processing│  │  State Manager  │
│ Claude/OpenAI  │  │ Deepgram/OpenAI │  │  (Redis/Memory) │
└────────────────┘  └─────────────────┘  └─────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼──────────┐
                    │  Database Layer   │
                    │  PostgreSQL/      │
                    │  Supabase         │
                    └────────┬──────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────────┐
│   TPV Adapter  │  │   Payment API   │  │   Monitoring   │
│   (Conectores) │  │  (Stripe/Mercado)│  │  (Datadog/New  │
│                │  │                 │  │   Relic)       │
└────────────────┘  └─────────────────┘  └────────────────┘
```

---

## 📊 Componentes por Capa

### **1. CAPA DE ENTRADA (Input Channels)**

| Componente | Tecnología | Propósito | Status |
|------------|-----------|----------|--------|
| **Telefonía** | Twilio API + SIP | Llamadas entrantes con audio bidireccional | Pendiente |
| **Mensajería** | Meta WhatsApp Business API | Recibir/enviar mensajes de texto | Pendiente |
| **Gateway** | ngrok (local) / CloudFlare Tunnel (prod) | Exponer servidor local para webhooks | Pendiente |

**Setup Inicial**:
```bash
# Twilio: Contratar número virtual y configurar WebSocket endpoint
# Meta: Crear app en Meta for Developers y configurar webhook URL
```

---

### **2. CAPA DE PROCESAMIENTO (Brain & Logic)**

#### **Motor de Lenguaje (LLM)**
| Componente | Tecnología | Propósito |
|------------|-----------|----------|
| **Modelo Principal** | Claude 3.5 Sonnet | Procesamiento de contexto y toma de decisiones |
| **Function Calling** | Claude Tools | Generar objetos JSON estructurados para pedidos |
| **System Prompt** | Custom (Config JSON) | Inyectar menú, precios, guardrails |

**Configuración Recomendada**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "temperature": 0.7,
  "system_prompt": "[menú inyectado + reglas]",
  "tools": [
    {
      "name": "create_order",
      "description": "Generar pedido estructurado",
      "input_schema": { ... }
    }
  ]
}
```

---

#### **Motor de Voz (Speech)**
| Componente | Tecnología | Latencia | Alternativas |
|------------|-----------|----------|--------------|
| **Speech-to-Text** | Deepgram (en tiempo real) | ~100-200ms | OpenAI Whisper (Turbo), AssemblyAI |
| **Text-to-Speech** | ElevenLabs Turbo | ~300-500ms | OpenAI TTS-1, Cartesia, Google Cloud TTS |
| **VAD** | Deepgram built-in | <50ms | Silero VAD (open-source) |

**Latencia Total Objetivo**: < 1.5 segundos (STT + LLM + TTS)

**Cálculo**:
- STT: 200ms
- LLM: 600ms (p95)
- TTS: 400ms
- **Total**: ~1.2s ✅

---

### **3. CAPA DE DATOS**

| Componente | Tecnología | Propósito | Plan |
|------------|-----------|----------|------|
| **Base Relacional** | PostgreSQL (Supabase) | Sesiones, pedidos, inventario | Local dev + Cloud prod |
| **Cache** | Redis / Memory | Estado de sesiones activas | Opcional en MVP |
| **Almacenamiento de Archivos** | S3 / Supabase Storage | Grabaciones de audio, transcripciones | Después del MVP |

**Schema Inicial** (Ver `MEMORY.md` para detalles):
```sql
CREATE TABLE sesiones_activas (
  id UUID PRIMARY KEY,
  canal TEXT, -- 'whatsapp' | 'voz'
  estado TEXT, -- 'activa' | 'completada' | 'error'
  creado_en TIMESTAMP,
  cliente_id TEXT
);

CREATE TABLE pedidos (
  id UUID PRIMARY KEY,
  sesion_id UUID REFERENCES sesiones_activas,
  estado TEXT, -- 'pendiente' | 'pagado' | 'enviado_tpv' | 'completado'
  items JSONB, -- [{product_id, cantidad, notas}]
  total DECIMAL,
  metodo_pago TEXT, -- 'stripe' | 'mercado_pago'
  creado_en TIMESTAMP
);
```

---

### **4. CAPA DE INTEGRACIÓN TPV**

#### **Estrategia de Adaptadores**

```javascript
// Estructura genérica
interface TPVAdapter {
  name: string;
  transformOrder(order: Order): TPVFormat;
  submitOrder(order: TPVFormat): Promise<TPVResponse>;
  getInventory(): Promise<Inventory>;
}

// Ejemplo: Adaptador Revo
class RevoAdapter implements TPVAdapter {
  async submitOrder(order) {
    // Mapear Order → Formato Revo API
    // POST /api/orders
  }
}
```

#### **TPVs a Soportar (Prioridad)**

| TPV | Tipo | Prioridad | Endpoint | Status |
|-----|------|-----------|----------|--------|
| **Revo** | Cloud-based | 1 (Piloto) | REST API | Pendiente |
| **Square** | Cloud-based | 2 | REST API | Pendiente |
| **Toast** | Cloud-based | 2 | REST API | Pendiente |
| **Legacy (Windows)** | Local | 3 | Agent local + DB | Pendiente |

---

#### **Plan B: Kitchen Display System (KDS) Propio**

Si la integración TPV no es viable:
- **Tecnología**: Next.js + WebSockets + Supabase
- **Interfaz**: Tablet en la cocina (iPad/Android)
- **Flujo**: Pedido aprobado → KDS en tiempo real → Cocinero marca "Listo"

---

### **5. CAPA DE PAGOS**

| Componente | Tecnología | Propósito |
|------------|-----------|----------|
| **Procesador Principal** | Stripe | Tarjetas de crédito, webhooks confiables |
| **Alternativa Regional** | Mercado Pago / PayPal | Para América Latina |
| **Flujo** | Payment Link API | Generar link único + esperar webhook |

**Flujo**:
```
1. LLM confirma pedido → JSON con total
2. Sistema genera Payment Link en Stripe
3. Link se envía por WhatsApp al cliente
4. Cliente paga
5. Webhook de Stripe → "payment.succeeded"
6. Sistema envía pedido al TPV
```

**Regla de Oro**:
> ⚠️ **EL PEDIDO NO LLEGA A LA COCINA HASTA QUE STRIPE CONFIRMA EL PAGO**

---

### **6. CAPA DE APLICACIÓN**

#### **Backend API**
| Componente | Tecnología | Propósito |
|------------|-----------|----------|
| **Runtime** | Node.js (LTS) o Python 3.11+ | Servidor principal |
| **Framework** | Express / FastAPI | Manejo de rutas y webhooks |
| **WebSockets** | socket.io / FastAPI WebSockets | Audio bidireccional |
| **Auth** | JWT / Supabase Auth | Seguridad básica |

#### **Frontend (Dashboard Dueño)**
| Componente | Tecnología | Propósito |
|------------|-----------|----------|
| **Framework** | Next.js 14+ / React | Interfaz responsiva |
| **Estilo** | Tailwind CSS | Diseño rápido |
| **Gráficos** | Recharts / Chart.js | Analítica de pedidos |
| **Real-time** | Supabase Realtime / WebSockets | Actualización en vivo de pedidos |

---

### **7. CAPA DE MONITOREO & OBSERVABILIDAD**

| Componente | Tecnología | Propósito |
|------------|-----------|----------|
| **Logs** | Winston / Python logging → Datadog | Trazabilidad |
| **Métricas** | Prometheus / Datadog | Latencia, errores, uptime |
| **Alertas** | PagerDuty / Slack | Notificación de fallos |
| **APM** | Datadog APM / New Relic | Análisis de rendimiento |

---

## 🚀 Stack por Sprint

### **Sprint 1: Infraestructura Base**
- Node.js / Python server
- Twilio SDK
- Meta Whatsapp SDK
- Supabase client
- ngrok

### **Sprint 2: Motor IA + Voz**
- Anthropic SDK (Claude API)
- Deepgram SDK
- ElevenLabs SDK
- WebSockets library

### **Sprint 3: TPV & Lógica**
- Adaptadores TPV (HTTP clients)
- JSON schema validation
- Error handling

### **Sprint 4: Pagos & Deploy**
- Stripe SDK
- PM2 / systemd (para process management)
- CloudFlare Tunnel (exposición segura)

---

## 📦 Dependencias NPM/pip (Inicial)

### **Node.js**
```json
{
  "dependencies": {
    "express": "^4.18",
    "socket.io": "^4.7",
    "@supabase/supabase-js": "^2.38",
    "@anthropic-ai/sdk": "^0.24",
    "twilio": "^3.x",
    "axios": "^1.6",
    "stripe": "^13.x"
  }
}
```

### **Python**
```
anthropic==0.24.0
fastapi==0.104.1
uvicorn==0.24.0
supabase==2.4.0
twilio==8.10.0
stripe==5.x
websockets==12.0
```

---

## 🔐 Configuración de Secretos

**Archivo**: `.env.local` (NUNCA commitear)

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Meta WhatsApp
META_BUSINESS_ACCOUNT_ID=...
META_ACCESS_TOKEN=...
META_VERIFY_TOKEN=...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Deepgram
DEEPGRAM_API_KEY=...

# ElevenLabs
ELEVENLABS_API_KEY=...

# Stripe
STRIPE_API_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Ambiente
NODE_ENV=development
LOG_LEVEL=debug
```

---

## 📈 Escalabilidad

### **MVP (Día 28)**
- 1 restaurante piloto
- ~50 pedidos/día
- 1 servidor (2GB RAM, 1 CPU)

### **Post-MVP (Mes 3)**
- 5-10 restaurantes
- ~500 pedidos/día
- 2-3 instancias + load balancer

### **Producción (Mes 6+)**
- 100+ restaurantes
- 5000+ pedidos/día
- Kubernetes cluster, CDN, multi-region

---

## ✅ Checklist Inicial

- [ ] Crear repositorio Git
- [ ] Configurar Supabase project
- [ ] Contratar número en Twilio
- [ ] Crear app en Meta for Developers
- [ ] Generar API keys y guardar en `.env.local`
- [ ] Instalar CLI tools (node, python, etc.)
- [ ] Clonar plantilla de proyecto
