# 📋 PLAN SEMANA 3 — Stripe (Pagos)

**Objetivo**: Después de confirmar un pedido, el sistema envía un link de pago por WhatsApp. Cuando el cliente paga, el pedido se marca como pagado.

**Nota**: Semana 1 y 2 deben estar completas antes de empezar.

---

## ESTADO ACTUAL

- [ ] Cuenta de Stripe creada (modo TEST)  
- [ ] Test API keys en .env.local  
- [ ] Servicio de Stripe creado  
- [ ] Webhook de Stripe configurado  
- [ ] Payment links se generan correctamente  
- [ ] Pagos completados marcan el pedido como pagado  
- [ ] Confirmación se envía por WhatsApp

---

## PRE-REQUISITOS

1. Cuenta en [https://dashboard.stripe.com](https://dashboard.stripe.com)  
2. Usar MODO TEST (no datos reales)  
3. En .env.local:

STRIPE\_PUBLIC\_KEY=pk\_test\_tu\_key

STRIPE\_SECRET\_KEY=sk\_test\_tu\_key

STRIPE\_WEBHOOK\_SECRET=whsec\_tu\_secret

---

## TAREAS

### Tarea 3.1 — Servicio de Stripe

**Archivo**: `src/services/stripe.ts`

**Funciones**:

- `createPaymentLink(orderId: string, items: OrderItem[], total: number)` → string  
    
  - Crea un Checkout Session en Stripe  
  - Incluye los items del pedido  
  - Total debe ser en centavos (ej: 850 para $8.50)  
  - Retorna el URL del payment link  
  - Guarda el payment\_id en Supabase


- `verifyWebhookSignature(body: string, signature: string)` → boolean  
    
  - Verifica que el webhook viene realmente de Stripe  
  - Usa STRIPE\_WEBHOOK\_SECRET


- `handleStripeWebhook(event: Stripe.Event)` → void  
    
  - Procesa evento checkout.session.completed  
  - Actualiza el pedido: payment\_status \= 'paid'  
  - Llama a sendWhatsAppMessage() para confirmar al cliente

### Tarea 3.2 — Rutas de Stripe

**Archivo**: `src/routes/payments.ts`

**Endpoint**:

- `POST /webhooks/stripe` — Webhook de Stripe  
  - Verifica firma con verifyWebhookSignature()  
  - Procesa el evento  
  - Responde 200 inmediatamente

### Tarea 3.3 — Integración en server.ts

Añade la ruta POST /webhooks/stripe

**IMPORTANTE**: El middleware para /webhooks/stripe debe usar `express.raw()` para leer el body raw (Stripe lo necesita para verificar firma).

### Tarea 3.4 — Actualizar webhook de WhatsApp

**Archivo a modificar**: `src/routes/webhooks.ts`

Cuando Claude detecte `action: "confirm_order"`:

1. Crear el pedido en Supabase  
2. Generar payment link con Stripe  
3. Enviar por WhatsApp:

Tu pedido está confirmado 🍔

\[RESUMEN DEL PEDIDO\]

Paga aquí: {payment\_link}

### Tarea 3.5 — Configurar webhook en Stripe

1. Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks  
2. "Add endpoint"  
3. URL: `https://TU-URL-NGROK/webhooks/stripe`  
4. Selecciona evento: `checkout.session.completed`  
5. Copia el Webhook Secret a .env.local

### Tarea 3.6 — Prueba de pago

**Flujo completo**:

1. Envía WhatsApp: "Quiero una Doble Cheese"  
2. Confirma: "Eso es todo"  
3. Recibe link de pago  
4. Abre el link  
5. Usa tarjeta de test: `4242 4242 4242 4242`  
6. Fecha: 12/25, CVC: 123  
7. Completa el pago  
8. Recibe WhatsApp de confirmación: "¡Tu pago ha sido recibido\!"  
9. Verifica en Supabase que order.payment\_status \= 'paid'

---

## TEST DE ÉXITO (Semana 3\)

- [ ] Payment links se generan correctamente ✅  
- [ ] Stripe webhook recibe eventos ✅  
- [ ] Pagos se marcan como completados ✅  
- [ ] Confirmaciones se envían por WhatsApp ✅  
- [ ] Historial de pagos se guarda en Supabase ✅

---

## COMMIT

git add .

git commit \-m "feat: integración Stripe — pagos por WhatsApp"

git push origin main

---

## ERRORES COMUNES

**Webhook no se verifica**

- ¿La URL es correcta?  
- ¿El Webhook Secret en .env.local es correcto?  
- ¿Stripe usa raw body y tu código lo verifica?

**Payment link no funciona**

- Verifica que STRIPE\_SECRET\_KEY es válido  
- Usa tarjeta de test de Stripe, no real  
- Revisa los logs de Stripe dashboard

**Pago no marca el pedido como pagado**

- Verifica que el webhook se recibe (logs del servidor)  
- Verifica que handleStripeWebhook() se ejecuta  
- Revisa que updateOrderStatus() funciona en Supabase

---

FIN PLAN SEMANA 3  
