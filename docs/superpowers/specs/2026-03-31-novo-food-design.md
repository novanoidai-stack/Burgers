# Novo Food Ecosystem — Design Spec
**Fecha**: 2026-03-31
**Versión**: 1.0
**Estado**: Aprobado por el usuario
**Arquitecto**: Lead Software Architect

---

## 1. VISIÓN DEL PRODUCTO

### ¿Qué es Novo Food?
Novo Food es una **plataforma SaaS multi-tenant** de automatización total para restaurantes y hamburgueserías. Su misión es eliminar la pérdida de clientes por llamadas no atendidas y saturación de personal mediante IA de voz y WhatsApp que se integra directamente con la cocina del restaurante.

### Posición de Mercado
- **No es** un chatbot genérico
- **Es** un ecosistema operativo completo que reemplaza o complementa el TPV del restaurante
- **Primera empresa** en unir voz AI de baja latencia + WhatsApp + KDS en tiempo real + analytics en un único producto configurable sin código

### Relación con Burger-AI
Burger-AI es el **primer cliente piloto** dentro de la plataforma Novo Food. Se migra la arquitectura existente al modelo multi-tenant. Burger-AI valida el producto en producción real desde día 1.

---

## 2. MODELO DE NEGOCIO — TRES PAQUETES

| Paquete | Concepto | Precio Est. | Target |
|---------|----------|-------------|--------|
| **NOVO CONNECT** | Middleware entre nuestra IA y su TPV actual | $299/mes | "No quiero cambiar nada" |
| **NOVO PRO** | Nuestro KDS/Dashboard paralelo, su TPV intacto | $599/mes | "Quiero más control, sin riesgos" |
| **NOVO TOTAL** | Reemplazo completo de su ecosistema | $1,299/mes | "Transformación total" |

**Estrategia de adopción**: Los clientes entran por CONNECT (bajo riesgo), escalan a PRO (mejor UX), pocos migran a TOTAL (upsell premium).

---

## 3. ARQUITECTURA GENERAL

```
┌────────────────────────────────────────────────────┐
│           CANALES DE ENTRADA (Cliente)             │
├──────────────┬─────────────┬───────────────────────┤
│ IA de Voz    │  WhatsApp   │  App Web (Reservas)   │
│ (Twilio SIP  │  (Meta API) │  (Next.js)            │
│ +Deepgram    │             │                       │
│ +ElevenLabs) │             │                       │
└──────────────┴─────────────┴───────────────────────┘
                      │
                      ↓
┌────────────────────────────────────────────────────┐
│      API GATEWAY — Node.js + TypeScript            │
│  • Orquestación de flujos                          │
│  • Normalización de inputs → Order object          │
│  • Auth middleware (JWT + tenant validation)       │
│  • Rate limiting por restaurante                   │
└─────────────────┬──────────────────────────────────┘
                  │
     ┌────────────┼──────────────┐
     ↓            ↓              ↓
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ LLM     │ │ TPV      │ │ Session      │
│ Engine  │ │ Adapters │ │ Manager      │
│ Claude  │ │ (3 tiers)│ │ (Redis/Mem)  │
│ 3.5     │ └──────────┘ └──────────────┘
└────┬────┘
     │ Function Calling → Order JSON
     ↓
┌────────────────────────────────────────────────────┐
│        SUPABASE — PostgreSQL Multi-Schema          │
│  ┌─ public ──┐  ┌─ restaurant_001 ──┐             │
│  │ users     │  │ orders            │             │
│  │ tenants   │  │ customers         │             │
│  │ billing   │  │ products          │             │
│  └───────────┘  │ sessions          │             │
│                 │ analytics_daily   │             │
│                 └───────────────────┘             │
│  (cada restaurante = schema independiente)        │
└─────────────────┬──────────────────────────────────┘
                  │
    ┌─────────────┼──────────────┐
    ↓             ↓              ↓
┌────────┐  ┌──────────┐  ┌──────────┐
│ Stripe │  │ WhatsApp │  │ Datadog  │
│(Pagos) │  │ (Notif.) │  │(Monitor) │
└────────┘  └──────────┘  └──────────┘
```

---

## 4. MULTI-TENANCY — SCHEMA-LEVEL

### Estrategia Elegida
**Schema-Level Tenancy** en PostgreSQL/Supabase. Cada restaurante tiene su propio schema.

### Estructura
```sql
-- Schema público (plataforma)
CREATE SCHEMA public;
  -- tenants (restaurants)
  -- users (admin, owners, staff)
  -- billing (suscripciones)
  -- packages (CONNECT/PRO/TOTAL)

-- Por cada restaurante:
CREATE SCHEMA restaurant_001;
CREATE SCHEMA restaurant_002;
  -- Mismo set de tablas, datos completamente aislados
```

### Por qué Schema-Level
1. **Seguridad**: Aislamiento físico a nivel PostgreSQL — imposible "filtrar" a otro schema sin cambiar el `search_path`
2. **Performance**: Queries de un restaurante no ven ni tocan datos de otro, índices independientes
3. **GDPR**: `DROP SCHEMA restaurant_123 CASCADE` elimina TODO atómicamente
4. **Escalabilidad**: Esquema predecible hasta 1000+ restaurantes en un mismo Supabase
5. **Operaciones**: Backup, restore, migración por restaurante independiente

### Escalera de Tenancy
- **Año 1 (5-50 restaurantes)**: Schema-Level en Supabase ($100/mes)
- **Año 2 (50-200)**: Schema-Level en PostgreSQL self-hosted (mayor control)
- **Año 3+ (200+)**: Clientes enterprise con opción Database-Level a $5k+/mes

---

## 5. MODELO DE DATOS — SCHEMA HÍBRIDO

### Schema `public` (Plataforma)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- 'burger-ai-madrid'
  name TEXT NOT NULL,                 -- 'Burger AI Madrid'
  schema_name TEXT UNIQUE NOT NULL,   -- 'restaurant_001'
  package TEXT NOT NULL,              -- 'connect' | 'pro' | 'total'
  config JSONB,                       -- Configuración del restaurante
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,                 -- 'owner' | 'staff' | 'cook'
  hashed_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema `restaurant_XXX` (Operacional por Restaurante)

#### Tablas Transaccionales (Operaciones rápidas)
```sql
-- Clientes del restaurante
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  preferences JSONB,                  -- {'no_cebolla': true, 'alergia_gluten': false}
  total_orders INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,             -- 'burger' | 'side' | 'drink' | 'dessert'
  stock_qty INT DEFAULT -1,           -- -1 = ilimitado
  is_available BOOLEAN DEFAULT true,
  available_modifiers JSONB,          -- ['sin_cebolla', 'doble_queso', ...]
  allergens JSONB,                    -- ['gluten', 'lactosa', ...]
  cook_time_minutes INT DEFAULT 5,    -- Para el Token de Tiempo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos (desnormalizado para velocidad)
CREATE TABLE orders (
  id TEXT PRIMARY KEY,                -- 'ORD-20260401-00001'
  customer_id UUID REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'confirmed' | 'paid' | 'sent_to_tpv' |
  -- 'in_preparation' | 'ready' | 'completed' | 'cancelled'

  -- Datos de la orden (JSONB para velocidad de lectura)
  items JSONB NOT NULL,
  -- [{product_id, name, qty, modifications: [], unit_price, subtotal}]
  summary JSONB NOT NULL,
  -- {subtotal, discount, tax_rate, tax, delivery_fee, total}
  delivery JSONB NOT NULL,
  -- {type: 'takeaway'|'delivery'|'table', address: {...}, table_number, estimated_time_min}

  -- Datos de sesión
  channel TEXT NOT NULL,              -- 'voice' | 'whatsapp'
  session_id UUID,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL,               -- 'stripe' | 'mercado_pago' | 'cash'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
  stripe_intent_id TEXT,
  stripe_link TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de IA
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  channel TEXT NOT NULL,              -- 'voice' | 'whatsapp'
  status TEXT NOT NULL,               -- 'active' | 'completed' | 'abandoned'
  llm_conversation JSONB,             -- Historial completo de mensajes
  order_id TEXT REFERENCES orders(id),
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Inventario actual
CREATE TABLE inventory (
  product_id UUID REFERENCES products(id) PRIMARY KEY,
  qty_available INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Reservas (mesas)
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  table_number INT NOT NULL,
  party_size INT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed',    -- 'confirmed' | 'seated' | 'completed' | 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificaciones enviadas
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  order_id TEXT REFERENCES orders(id),
  type TEXT NOT NULL,                 -- 'order_confirmed' | 'in_preparation' | 'ready'
  channel TEXT NOT NULL,             -- 'whatsapp' | 'sms'
  status TEXT DEFAULT 'sent',
  content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla de Auditoría (Trazabilidad completa)
```sql
CREATE TABLE order_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(id),
  event_type TEXT NOT NULL,           -- 'created' | 'paid' | 'sent_to_tpv' | 'ready'
  full_state JSONB NOT NULL,          -- Estado COMPLETO de la orden en ese momento
  triggered_by TEXT,                  -- 'lm_function_call' | 'stripe_webhook' | 'cook_action'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla de Analítica (Sin impactar operaciones)
```sql
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  units_sold INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  avg_prep_time_sec INT,
  channel_voice INT DEFAULT 0,
  channel_whatsapp INT DEFAULT 0,
  top_modifications JSONB,            -- ['sin_cebolla': 45, 'doble_queso': 23, ...]
  UNIQUE(date, product_id)
);
-- Refresh cada hora (no impacta prod):
-- INSERT INTO analytics_daily ... ON CONFLICT DO UPDATE ...
```

---

## 6. MOTOR DE INTELIGENCIA

### 6.1 Token de Tiempo — Gestión de Saturación de Cocina
```
Concepto: Cada producto consume X minutos de cocina.
Si suma de pedidos en cola > THRESHOLD (configurable), la IA:
  1. Avisa al cliente del tiempo estimado real
  2. Ofrece confirmación: "¿Acepta esperar 45 minutos?"
  3. Si no acepta, cancela y registra intent perdido en analytics
  4. Si acepta, confirma con tiempo ajustado

Implementación:
  kitchen_load = SUM(productos_en_cola × cook_time_minutes)
  threshold = restaurant_config.max_kitchen_minutes (default: 60)
  if kitchen_load > threshold:
      estimated_extra = kitchen_load - threshold
      LLM informa al cliente
```

### 6.2 Stock Dinámico — Flags en Tiempo Real
```
Al inicio de CADA sesión (voz/WhatsApp):
  1. Query a inventory donde qty_available = 0
  2. Query a products donde is_available = false
  3. Inyectar lista de OOS en System Prompt del LLM:
     "Productos NO disponibles hoy: [Burger BBQ, Papas Deluxe]"
  4. LLM no los ofrece NI los acepta en pedidos

Actualización de stock:
  - Dueño puede apagar/encender desde panel no-code
  - Automático: cuando order.paid, decrementar inventory.qty_available
```

### 6.3 Panel No-Code para Dueños
Interfaz web (Next.js) con:
```
- Toggle on/off por producto (stock agotado)
- Editar precios en tiempo real
- Configurar límite de cocina (max_kitchen_minutes)
- Bloquear rango de horas (sin pedidos de 14:00-15:00)
- Ver KDS en tiempo real (si paquete PRO/TOTAL)
- Dashboard de analíticas básicas (si paquete PRO/TOTAL)
```

---

## 7. INTEGRACIÓN TPV — ADAPTER PATTERN

### Interface Universal
```typescript
interface TPVAdapter {
  name: string;
  packageTier: 'connect' | 'pro' | 'total';
  transformOrder(order: NovoOrder): TPVFormat;
  submitOrder(order: TPVFormat): Promise<TPVResponse>;
  getMenuSync?(): Promise<MenuItem[]>;
  getInventorySync?(): Promise<InventoryItem[]>;
}
```

### Implementaciones por Paquete

**CONNECT** — Adaptadores API:
- `src/adapters/tpv/revo.ts`
- `src/adapters/tpv/square.ts`
- `src/adapters/tpv/toast.ts`
- `src/adapters/tpv/legacy-agent.ts` (Windows local DB)

**NOVO PRO** — KDS Propio:
- `src/adapters/tpv/novo-kds.ts`
- Tablet en cocina (Next.js + Supabase Realtime)
- Estados: Pendiente → En Cocina → Listo → Entregado

**NOVO TOTAL** — Ecosistema Propio:
- `src/adapters/tpv/novo-pos.ts`
- POS completo (futuro — sprint 5+)

---

## 8. FLUJO DE PEDIDO END-TO-END

```
1. CLIENTE CONTACTA
   └─ Voz: Twilio SIP → WebSocket → Deepgram STT → texto
   └─ WhatsApp: Meta webhook → texto directo

2. LLM PROCESA (Claude 3.5 Sonnet)
   └─ Consulta BD: stock, precios, kitchen_load
   └─ Genera respuesta (voz: ElevenLabs TTS)
   └─ Detecta intención: PEDIR | RESERVAR | INFO

3. ORDER BUILDER
   └─ Function Calling → JSON estructurado Order
   └─ Validación: stock, delivery_zones, horario

4. PAGO
   └─ Genera Stripe Payment Link
   └─ Envía link por WhatsApp
   └─ Espera webhook: payment.succeeded
   ⚠️ GOLDEN RULE: nada va a cocina sin pago confirmado

5. DISPATCH A COCINA
   └─ INSERT INTO orders (...)
   └─ INSERT INTO order_snapshots (event: 'created')
   └─ → TPVAdapter.submitOrder() (según paquete)
   └─ → KDS actualiza en tiempo real (WebSocket)
   └─ → analytics_daily UPDATE

6. NOTIFICACIONES
   └─ "¡Tu pedido está en cocina! 🍔" (WhatsApp)
   └─ Cocinero marca "listo" en KDS
   └─ "¡Listo para recoger!" (WhatsApp)

7. COMPLETION
   └─ order.status = 'completed'
   └─ INSERT INTO order_snapshots (event: 'completed')
   └─ UPDATE analytics_daily
```

---

## 9. STACK TÉCNICO COMPLETO

### Backend
| Componente | Tecnología | Por qué |
|-----------|-----------|---------|
| Runtime | Node.js 20 LTS | Mejor WebSockets para audio |
| Lenguaje | TypeScript 5+ | Type safety en APIs complejas |
| Framework | Express 4 | Familiar, flexible |
| WebSockets | ws + socket.io | Audio bidireccional |
| Auth | JWT + Supabase Auth | Simple, robusto |

### IA y Voz
| Componente | Tecnología | Latencia |
|-----------|-----------|---------|
| STT | Deepgram Nova-2 | ~200ms |
| LLM | Claude 3.5 Sonnet | ~600ms |
| TTS | ElevenLabs Turbo | ~350ms |
| VAD | Deepgram built-in | <50ms |
| **Total** | | **~1.2s** ✅ |

### Datos
| Componente | Tecnología | Por qué |
|-----------|-----------|---------|
| DB | PostgreSQL vía Supabase | ACID, Schema-Level |
| Multi-tenant | Schema-Level | Aislamiento sin costo |
| Cache | Redis (opcional) | Sessions activas |
| Storage | Supabase Storage / S3 | Audio, imágenes |
| ORM | Drizzle ORM | TypeScript-first, ligero |

### Frontend
| Componente | Tecnología | Propósito |
|-----------|-----------|---------|
| Dashboard | Next.js 14+ | Admin panel, analytics |
| KDS | Next.js + Realtime | Tablet cocina |
| UI | Tailwind + shadcn/ui | Rápido, profesional |
| Realtime | Supabase Realtime | Updates KDS instantáneos |

### Infraestructura
| Componente | Tecnología | Propósito |
|-----------|-----------|---------|
| Hosting | Vercel (frontend) + Railway/Fly.io (backend) | Escalable |
| Pagos | Stripe + Mercado Pago | Global + LATAM |
| Voz | Twilio SIP | Números virtuales |
| WhatsApp | Meta Business API | Mensajería |
| Monitoreo | Datadog | Latencia, errores |
| Tunelado (dev) | ngrok / Cloudflare Tunnel | Webhooks locales |

---

## 10. RECOMENDACIONES DE MODELO CLAUDE POR TAREA

| Tarea | Modelo Recomendado | Por qué |
|-------|-------------------|---------|
| **Arquitectura / Planning** | `claude-opus-4-6` | Razonamiento profundo, decisiones complejas |
| **Tomar pedido por voz (LLM core)** | `claude-sonnet-4-6` | Velocidad + calidad, balance ideal |
| **Procesar texto WhatsApp** | `claude-haiku-4-5` | Ultra-rápido, bajo costo, mensajes simples |
| **Function Calling (Order JSON)** | `claude-sonnet-4-6` | Precisión en output estructurado |
| **Detectar intención básica** | `claude-haiku-4-5` | Barato y suficiente para routing |
| **Escribir código** | `claude-sonnet-4-6` | Código de calidad producción |
| **Revisar arquitectura** | `claude-opus-4-6` | Detecta errores profundos |
| **Generar tests** | `claude-sonnet-4-6` | Tests completos y precisos |
| **Documentación técnica** | `claude-sonnet-4-6` | Claridad y profundidad |
| **Debugging complejos** | `claude-opus-4-6` | Para problemas difíciles de diagnosticar |
| **Generación de SQL básico** | `claude-haiku-4-5` | Rápido para queries sencillos |
| **Generación de SQL complejo** | `claude-sonnet-4-6` | Queries analíticos, migraciones |
| **System Prompt del LLM (draft)** | `claude-opus-4-6` | El núcleo del producto, máxima calidad |

---

## 11. FASES DE DESARROLLO

### FASE 0: Cimientos Multi-Tenant (Semanas 1-2)
**Objetivo**: Infraestructura base de Novo Food que soporte multi-tenant
**Tareas**:
- [ ] Repo `novo-food` inicializado (monorepo o multi-repo)
- [ ] Supabase: schema `public` + migration para tenants/users
- [ ] API Gateway base con middleware de tenant isolation
- [ ] Script de creación de schema por restaurante
- [ ] Migrar Burger-AI como `restaurant_001`
**Modelo**: `claude-sonnet-4-6`
**Entregable**: `npm run create-tenant --name "Burger AI" --slug "burger-ai"`

### FASE 1: Canales IA (Semanas 3-5)
**Objetivo**: Voz + WhatsApp funcionando end-to-end
**Tareas**:
- [ ] Migrar Twilio SIP + WebSocket de Burger-AI
- [ ] Deepgram STT con VAD
- [ ] Claude 3.5 Sonnet + Function Calling → Order JSON
- [ ] ElevenLabs TTS con cancelación mid-sentence
- [ ] WhatsApp webhook + parser
- [ ] Sistema de sesiones en Redis
**Latencia target**: < 1.5s
**Modelo**: `claude-sonnet-4-6` para código, `claude-opus-4-6` para System Prompt

### FASE 2: Motor de Inteligencia (Semana 6)
**Objetivo**: Stock dinámico + saturación de cocina
**Tareas**:
- [ ] Token de Tiempo (kitchen load calculator)
- [ ] OOS flags consultados al inicio de sesión
- [ ] Inyección dinámica de menu en System Prompt
- [ ] Lógica de reservas vs pedidos
**Modelo**: `claude-sonnet-4-6`

### FASE 3: KDS + NOVO PRO (Semanas 7-8)
**Objetivo**: Tablet funcional en cocina
**Tareas**:
- [ ] KDS en Next.js + Supabase Realtime
- [ ] Estados: Pendiente → En Cocina → Listo → Entregado
- [ ] Notificaciones WhatsApp por cambio de estado
- [ ] Panel No-Code para dueños (stock on/off, precios)
**Modelo**: `claude-sonnet-4-6` para frontend

### FASE 4: Adaptadores TPV + CONNECT (Semanas 9-10)
**Objetivo**: Primeros adaptadores de TPV externos
**Tareas**:
- [ ] Interface `TPVAdapter` TypeScript
- [ ] Adaptador Revo (primer piloto)
- [ ] Adaptador Square
- [ ] Adaptador Legacy (Windows agent)
- [ ] Test con restaurante real
**Modelo**: `claude-sonnet-4-6`, `claude-opus-4-6` para investigar APIs

### FASE 5: Analytics + Dashboard (Semana 11)
**Objetivo**: Dashboard de analítica para dueños
**Tareas**:
- [ ] `analytics_daily` refresh job
- [ ] Dashboard Next.js: ingresos, pedidos, top productos
- [ ] Historial de sesiones de voz (reproducir)
- [ ] Control de stock avanzado
**Modelo**: `claude-sonnet-4-6`

### FASE 6: NOVO TOTAL — Ecosistema Propio (Semanas 12-14)
**Objetivo**: POS propio para restaurantes que quieren reemplazo total
**Tareas**:
- [ ] Novo POS (punto de venta)
- [ ] Novo Delivery (tracking de repartidores)
- [ ] Novo Payments (integración profunda Stripe/MP)
- [ ] Modo offline (fallback sin internet)
**Modelo**: `claude-opus-4-6` para arquitectura, `claude-sonnet-4-6` para código

---

## 12. COHERENCIA CHECK (Self-Review)

### ✅ Decisiones Consistentes
- Schema-Level Tenancy ↔ Hybrid Data Model: **Compatible** (schemas independientes, cada uno con tablas JSONB)
- Node.js TypeScript ↔ WebSockets Twilio: **Compatible** (ws library, bajo overhead)
- Claude Function Calling ↔ Order JSON Schema: **Compatible** (el schema existente es válido en Novo Food)
- Stripe Payment-First ↔ Kitchen Dispatch: **Compatible** (webhook → insert orders)
- Supabase Realtime ↔ KDS: **Compatible** (Supabase Realtime usa PostgreSQL LISTEN/NOTIFY)

### ✅ Schema Order Existente
El `src/schemas/order.json` de Burger-AI es **100% compatible** con Novo Food. El campo `restaurant_config.restaurant_id` pasa a ser el `tenant slug`. Sin cambios necesarios.

### ✅ Sin Conflictos en 3 Paquetes
- CONNECT: Solo necesita adaptadores (código adicional, no toca core)
- NOVO PRO: Usa KDS que ya construimos en Fase 3
- NOVO TOTAL: Extensión del ecosistema, no rompe lo anterior

### ⚠️ Puntos de Atención
1. **Redis para sesiones**: Puede ser memoria en MVP (Sprint 1), Redis en producción
2. **Stripe antes de kitchen**: Enforced en código, pero necesita test explícito
3. **TPV legacy Windows**: Requiere agente local instalado en el restaurante (complejidad de distribución)
4. **NOVO TOTAL timeline**: 14 semanas es optimista para 2 devs — revisitar en Fase 5

---

## 13. DEFINICIÓN DE DONE POR FASE

| Fase | Done Cuando... |
|------|---------------|
| 0 | `novo-food dev` corre, Burger-AI responde como tenant |
| 1 | Llamada → Order JSON → WhatsApp confirma en < 1.5s |
| 2 | Stock OOS no ofrecido; saturación cocina → mensaje cliente |
| 3 | Tablet cocina muestra órdenes en tiempo real; dueño edita stock |
| 4 | Orden enviada a Revo TPV real exitosamente |
| 5 | Dashboard muestra top 5 productos + ingresos del día |
| 6 | Restaurante piloto opera 100% con Novo (sin TPV antiguo) |
