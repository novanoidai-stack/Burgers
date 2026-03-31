# 🔄 ESTADO ACTUAL - Burger-AI

## 📅 Fecha de Actualización
**2026-03-30** - Inicialización del proyecto

## ✅ Estado del Proyecto

```
┌─────────────────────────────────────────────────────────┐
│              PHASE: PLANNING & ARCHITECTURE             │
│                                                         │
│  ✅ Roadmap definido (4 sprints / 28 días)            │
│  ✅ Tech stack documentado                             │
│  ✅ Vault de memoria inicializado                      │
│  ✅ Backend language: Node.js + TypeScript             │
│  ✅ Motor de voz: Twilio SIP + Deepgram + ElevenLabs  │
│  ✅ Decisiones arquitectónicas documentadas            │
│  ⏳ Order schema - LISTA PARA CREAR (src/schemas/)    │
│  ⏳ Git repo no inicializado                           │
│  ⏳ Sprint 1 comienza: 2026-04-01                      │
└─────────────────────────────────────────────────────────┘
```

**Última actualización**: 2026-03-31 (decisiones críticas tomadas)

---

## 🎯 Hito Actual: Definición del Schema de Datos

### **¿Dónde estamos?**
Acabamos de crear el vault y documentar la visión arquitectónica. Ahora necesitamos establecer **el contrato de datos** que compartirán:
- La IA (al recibir pedidos de voz/WhatsApp)
- El TPV (al entregar pedidos a la cocina)
- El sistema de pagos (Stripe)
- El dashboard de administración

### **¿Qué falta?**
1. **Definir el objeto `Order` (Pedido)** - schema JSON que será el "lenguaje común"
2. **Crear las tablas en Supabase** basadas en ese schema
3. **Inicializar repositorio Git** con estructura de proyecto
4. **Asignar sprints** a desarrolladores

---

## 📊 Tabla: Estado de Tareas Críticas

**NOTA**: Equipo de 2 personas (no 3 como en plan original). Sprints redistribuidos.

| Tarea | Responsable | Estado | Bloqueador | Deadline |
|-------|-------------|--------|-----------|----------|
| Crear `src/schemas/order.json` | ARQUITECTO | 🔄 EN PROGRESO | Ninguno | 2026-03-31 ⏰ |
| Inicializar Git + estructura | DEV 1 | 🔲 PENDIENTE | Schema Order ✅ | 2026-04-01 |
| Supabase project + migrations | DEV 1 | 🔲 PENDIENTE | Schema Order ✅ + Git | 2026-04-02 |
| WhatsApp webhook receiver | DEV 1 | 🔲 PENDIENTE | Repo Git + Meta credentials | 2026-04-03 |
| Twilio SIP + WebSocket audio | DEV 2 | 🔲 PENDIENTE | Repo Git + Twilio number | 2026-04-01 |
| Deepgram STT integration | DEV 2 | 🔲 PENDIENTE | Twilio SIP working | 2026-04-05 |

---

## 🔗 Dependencias Entre Tareas

```
Schema Order (BLOQUEADOR CRÍTICO)
    ├─→ Crear tablas Supabase
    ├─→ LLM System Prompt v1
    ├─→ Adaptador TPV (mapeo de IDs)
    └─→ Stripe Payment Link (estructura)

Setup WhatsApp + Twilio (Parallelizable)
    ├─→ DEV 1: WhatsApp
    └─→ DEV 2: Voz

Base de Datos
    └─→ Todas las demás capas
```

---

## 📝 Próximos Pasos Inmediatos (ORDEN DE EJECUCIÓN)

### **PASO 1️⃣: Schema del Objeto `Order`** ✅ COMPLETADO
**Entregable**: `src/schemas/order.json` (JSON Schema v7)

**Incluye**:
- ✅ Identificadores únicos (order_id, session_id, restaurant_id)
- ✅ Items con modificadores y precios
- ✅ Cliente (nombre, teléfono, email opcional)
- ✅ Delivery flexible: takeaway | delivery | table
- ✅ Dirección de entrega (solo si delivery)
- ✅ Número de mesa (solo si table)
- ✅ Precios desglosados (subtotal, tax, delivery_fee, total)
- ✅ Payment (status, method, Stripe link)
- ✅ Estado completo (pending → completed/cancelled)
- ✅ Metadata (canal, timestamps, TPV config, restaurant config)

**Características clave**:
- Soporte **multi-local**: `restaurant_config` permite gestionar múltiples restaurantes
- **Delivery configurable**: `delivery.type` puede ser takeaway, delivery o table (mesa)
- **Flexible**: Las direcciones y números de mesa se rellenan condicionalmente
- **JSON Schema completo**: Validación automática en código

**Ubicación**: `src/schemas/order.json` (listo para usar en DB migrations)

---

### **PASO 2️⃣: Inicializar Git + Estructura** ⏳ PRÓXIMO
**Responsable**: DEV 1
**Duración estimada**: ~1 hora
**Deadline**: 2026-04-01 (mañana, antes de Sprint 1)

**Pre-requisitos**:
- [ ] Schema Order ✅ (ya hecho)
- [ ] Repositorio GitHub creado (debe hacer manualmente)
- [ ] Node.js 18+ instalado

**Estructura a crear**:
```
burger-ai/
├── src/
│   ├── backend/            # Express/Node.js
│   │   ├── routes/
│   │   ├── services/
│   │   ├── adapters/
│   │   └── db/
│   ├── frontend/           # Next.js (Sprint 2+)
│   └── schemas/            # ✅ order.json ya aquí
├── tests/
├── docs/vault/            # ✅ Existe
├── .env.example           # ✅ Existe
├── docker-compose.yml     # A crear
├── package.json           # A crear
├── tsconfig.json          # A crear
└── .gitignore             # A crear
```

**Archivos ya preparados**:
- `src/schemas/order.json` ✅
- `.env.example` ✅
- `CLAUDE.md` con comandos ✅
- `docs/PLUGIN_SETUP.md` ✅

---

### **PASO 3️⃣: Contratar Servicios Externos** ⏳ CRÍTICO PARA SPRINT 1
**Responsable**: ARQUITECTO + DEV 1
**Duración estimada**: ~4 horas
**Deadline**: 2026-04-01 (antes de que DEV 2 necesite Twilio)

**Checklist de servicios**:
- [ ] **Twilio**: Crear cuenta, contratar número SIP virtual (~ $1/mes)
- [ ] **Meta Developers**: Crear app, configurar WhatsApp Business API
- [ ] **Supabase**: Crear proyecto, copiar URL + keys
- [ ] **Anthropic**: Generar API key de Claude
- [ ] **Deepgram**: Crear cuenta, generar API key (free tier: 50k/mes)
- [ ] **ElevenLabs**: Crear cuenta, plan Turbo si presupuesto permite
- [ ] **Stripe**: Crear cuenta, generar API keys (test + live)

**Archivo de referencia**: `.env.example` (plantilla completa)

**Guardar secretos en**:
- Archivo `.env.local` (NUNCA commitear)
- Agregar `.env.local` a `.gitignore`

**Para Git Hub**:
```bash
echo ".env.local" >> .gitignore
```

---

### **PASO 4️⃣: Implementar Sprint 1 (Días 1-7)**
**Responsable**: 3 Desarrolladores (3 horas diarias)
**Inicio**: 2026-04-01
**Fin**: 2026-04-07

Dividido en 3 pistas paralelas:
- **DEV 1**: WhatsApp API receiver + ngrok setup
- **DEV 2**: Twilio SIP + WebSocket handler
- **DEV 3**: Supabase DB + schema migrations

---

## 📚 Archivos de Referencia

- 📖 `roadmap.md` - Plan maestro (¿A DÓNDE vamos?)
- 🛠️ `tech_stack.md` - Stack técnico (¿CON QUÉ lo hacemos?)
- 📋 `current.md` - ESTE ARCHIVO (¿DÓNDE estamos ahora?)
- 💾 `memory.md` - Decisiones técnicas (¿POR QUÉ decidimos esto?)

---

## 🚨 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|--------|-----------|
| TPV no tiene API documentada | MEDIA | ALTO | Plan B: KDS propio + agent local |
| Latencia de voz > 1.5s | BAJA | ALTO | Testing temprano con Deepgram/ElevenLabs |
| Rate limiting de Stripe | BAJA | MEDIO | Queue de pagos + reintentos |
| Fallo de Supabase | BAJA | CRÍTICO | Backup automático + alertas |

---

## 💡 Decisiones Arquitectónicas (Actualizado 31/03)

| Decisión | Estado | Registrado |
|----------|--------|-----------|
| Node.js vs Python | ✅ **Node.js + TypeScript** | memory.md |
| Vapi vs Twilio SIP | ✅ **Twilio SIP + Deepgram + ElevenLabs** | memory.md |
| Supabase vs PostgreSQL local | ✅ **Supabase** (ACID + realtime) | memory.md |
| KDS propio | ⏳ Depende de TPV piloto | Decidir en Sprint 3 |
| Menú dinámico (RAG) | ⏳ Probablemente sí, pero validar en Sprint 2 | - |

---

## 📞 Contactos Clave (A LLENAR)

| Rol | Nombre | Contacto | Disponibilidad |
|-----|--------|----------|----------------|
| Arquitecto de Software | - | - | - |
| DEV Backend | - | - | - |
| DEV Voz/IA | - | - | - |
| DEV Database | - | - | - |
| Product Owner | - | - | - |
| Cliente Piloto (Restaurante) | - | - | - |

---

## 🎓 Conocimiento Base Requerido

- [ ] Todos leer `roadmap.md`
- [ ] DEV 1 leer sección WhatsApp en `tech_stack.md`
- [ ] DEV 2 leer sección Voz en `tech_stack.md`
- [ ] DEV 3 leer sección Database en `tech_stack.md`

---

## ✨ Notas

- Este archivo se actualiza **después de cada milestone**
- Cada cambio de estado debe registrarse en **`memory.md`** si es una decisión técnica
- Usar este archivo como **"punto de entrada"** cada vez que se inicia una sesión
