# INTEGRATION LOGIC — Novo Food
**Última actualización**: 2026-03-31

---

## 1. FLUJO END-TO-END (De Cliente a Cocina)

```
1. CLIENTE LLAMA / WHATSAPP
   └─→ Twilio SIP (voz) | Meta API (WhatsApp)

2. INPUT NORMALIZADO
   └─→ Audio → Deepgram STT → texto
   └─→ WhatsApp mensaje → texto directo

3. LLM PROCESA
   └─→ Claude 3.5 Sonnet (voz) | Claude Haiku (WhatsApp simple)
   └─→ Consulta BD: stock, precios, reglas del restaurante
   └─→ Function Calling → JSON Order (borrador)

4. MOTOR DE TIEMPO (Token de Tiempo)
   └─→ kitchen_load = SUM(items_en_cola × cook_time_minutes)
   └─→ Si kitchen_load > threshold (default 60 min):
       LLM avisa cliente: "Tiempo estimado: X minutos. ¿Continúas?"

5. CLIENTE CONFIRMA
   └─→ Stripe Payment Link enviado (voz: por SMS/WhatsApp; WhatsApp: inline)
   └─→ Sistema espera webhook: payment.succeeded

6. PAGO CONFIRMADO → ORDEN ENTRA A COCINA
   └─→ INSERT INTO restaurant_XXX.orders (...)
   └─→ INSERT INTO restaurant_XXX.order_snapshots (estado completo JSONB)
   └─→ Supabase Realtime notifica KDS

7. TPV RECIBE (depende del paquete)
   ├─ CONNECT: POST a API del TPV del cliente
   ├─ NOVO PRO: KDS tablet en cocina (Next.js + WebSocket)
   └─ NOVO TOTAL: Nuestro POS gestiona todo

8. NOTIFICACIÓN AL CLIENTE
   └─→ WhatsApp: "Tu pedido está en cocina"
   └─→ Cuando listo: "Listo para recoger / en camino"
```

---

## 2. ADAPTER PATTERN — INTEGRACIÓN TPV

### Interface TypeScript

```typescript
interface TPVAdapter {
  transformOrder(order: Order): TPVOrder;
  submitOrder(tpvOrder: TPVOrder): Promise<TPVResponse>;
  checkStatus(externalId: string): Promise<OrderStatus>;
}
```

### Clases Implementadas

| Clase | TPV | Package |
|-------|-----|---------|
| `RevoAdapter` | Revo | CONNECT |
| `SquareAdapter` | Square | CONNECT |
| `ToastAdapter` | Toast | CONNECT |
| `KDSAdapter` | Nuestro KDS | NOVO PRO / fallback |
| `NullAdapter` | Sin TPV | Testing |

### Agregar nuevo TPV
1. Crear `src/backend/adapters/tpv/<nombre>.ts`
2. Implementar los 3 métodos de `TPVAdapter`
3. Registrar en `TPVFactory` con el identificador
4. ~200 líneas, sin tocar el resto del código

---

## 3. CANALES DE ENTRADA

### Canal de Voz (Twilio SIP)
- **Latencia objetivo**: <1.5s total (STT + LLM + TTS)
- **Flujo**: Twilio SIP → WebSocket → Deepgram STT (VAD) → Claude → ElevenLabs TTS → Twilio
- **VAD**: Deepgram detecta fin de habla en <50ms
- **Interrupción**: Full-duplex — cliente puede interrumpir respuesta del bot
- **Sesión**: Redis almacena contexto de la llamada

### Canal WhatsApp (Meta API)
- **Flujo**: Meta Webhook → Express route → Claude Haiku → respuesta texto
- **Adjuntos**: Soporte para imágenes (menú visual) vía Media API
- **Templates**: Pre-aprobados para confirmaciones y notificaciones

### Canal Web (Reservas) — Fase 5+
- **Stack**: Next.js + Supabase Auth
- **Función principal**: Reservas + previsualización menú
- **Integración**: Crea Order con `channel: "web"`

---

## 4. SESSION MANAGER

```typescript
interface Session {
  id: string;
  restaurant_id: string;
  channel: 'voice' | 'whatsapp' | 'web';
  customer_phone: string;
  order_draft: Partial<Order>;
  llm_history: Message[];  // max últimos 20 mensajes
  created_at: Date;
  last_activity: Date;
}
```

- **Storage**: Redis (TTL: 30 min inactividad)
- **Persistencia**: Al cerrar → INSERT sessions en Supabase (para analytics)
- **Recuperación**: Si mismo número llama en <2h, se ofrecen items del carrito previo

---

## 5. NOTIFICACIONES (WhatsApp)

| Evento | Template | Timing |
|--------|----------|--------|
| Pago recibido | "Tu pedido #XXX está confirmado y en cocina" | Inmediato post-pago |
| Pedido listo | "Tu pedido #XXX está listo" | Cuando cocina marca listo en KDS |
| Delivery en camino | "Tu pedido está en camino, ~X min" | Cuando repartidor acepta |
| Pago fallido | "Hubo un error con tu pago. Link nuevo: [URL]" | 3 intentos automáticos |

---

## 6. MANEJO DE ERRORES

| Error | Comportamiento |
|-------|----------------|
| TPV no responde | Guardar en queue, reintentar 3x, notificar dueño por WhatsApp |
| Pago fallido | Reintentar 3x Stripe, nuevo link si persiste |
| Deepgram timeout | Fallback a "No escuché bien, ¿puedes repetir?" |
| ElevenLabs error | Fallback a texto plano por WhatsApp |
| Supabase conexión | Circuit breaker + retry con backoff exponencial |
