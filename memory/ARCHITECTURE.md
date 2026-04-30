# Arquitectura del Sistema — Novo Burger

## Diagrama del Flujo Principal

CLIENTE (WhatsApp)
│
▼
META WEBHOOK ──────────► Express Server (:3001)
│                       POST /webhooks/whatsapp
│
▼
VALIDACIÓN ────────────► Verificar token, extraer datos
│                       (número teléfono, mensaje)
│
▼
CLAUDE API ────────────► processWithClaude(mensaje, contexto)
│                       Retorna: {action, order, response}
│
▼
SUPABASE ──────────────► Crear/actualizar pedido en BD
│                       Guardar conversación
│
▼
META API ──────────────► Enviar respuesta al cliente
│                       por WhatsApp
│
▼
CLIENTE recibe respuesta

## Componentes

### 1. Express Server (server.ts)

- GET /health → Estado del servidor

- POST /webhooks/whatsapp → Recibe mensajes de Meta

- POST /api/orders → Crea/actualiza pedidos

- GET /api/orders/:id → Consulta pedidos

### 2. Servicio Claude (services/claude.ts)

- Función: processWithClaude(userMessage, clientContext)

- Entrada: Mensaje del cliente + historial de conversación

- Salida: JSON con {action, order, response_message}

- Acciones posibles: crear_pedido, consultar_menu, confirmar_pedido, preguntar_mas

### 3. Servicio Supabase (services/supabase.ts)

- Conexión a PostgreSQL

- CRUD para todas las tablas

- Funciones: createOrder, getOrder, updateOrder, getConversation, etc.

### 4. Servicio WhatsApp (services/whatsapp.ts)

- Validar webhooks (verificar token de Meta)

- Parsear mensajes entrantes

- Enviar mensajes de vuelta via Meta API

- Manejar errores de envío

### 5. Servicio Stripe (services/stripe.ts) — Semana 3

- Crear payment links

- Verificar pagos completados

- Webhooks de Stripe

## Tablas de Base de Datos

### users

- id (UUID, PK)

- phone (string, único)

- name (string, nullable)

- email (string, nullable)

- created_at (timestamp)

- updated_at (timestamp)

### orders

- id (UUID, PK)

- user_id (FK → users)

- status (enum: pending, confirmed, paid, preparing, ready, completed, cancelled)

- items (JSONB — array de items del pedido)

- total (decimal)

- payment_status (enum: pending, paid, failed)

- payment_id (string, nullable)

- channel (enum: whatsapp, voice)

- created_at (timestamp)

- updated_at (timestamp)

### menu_items

- id (UUID, PK)

- name (string)

- description (string)

- price (decimal)

- category (string — hamburguesas, bebidas, complementos, etc.)

- available (boolean)

- image_url (string, nullable)

- created_at (timestamp)

### payments

- id (UUID, PK)

- order_id (FK → orders)

- stripe_payment_id (string)

- amount (decimal)

- status (enum: pending, completed, failed, refunded)

- method (string)

- created_at (timestamp)

### conversations

- id (UUID, PK)

- user_id (FK → users)

- order_id (FK → orders, nullable)

- messages (JSONB — array de mensajes)

- channel (enum: whatsapp, voice)

- created_at (timestamp)

- updated_at (timestamp)
