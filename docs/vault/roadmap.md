# 🗺️ ROADMAP - Burger-AI

## Visión General
**Objetivo**: Crear un ecosistema de pedidos por Voz/WhatsApp para hamburgueserías que se integre con su TPV existente, permitiendo que la IA tome pedidos de forma autónoma, natural y sin latencia perceptible.

**Timeline**: 4 Sprints / 28 Días (MVP Funcional)
**Equipo**: 3 Desarrolladores (3 horas diarias mínimo)
**Resultado Final**: Interceptor funcional conectado al TPV de un cliente piloto

---

## 📋 Fases del Proyecto

### **FASE 1: Arquitectura del "Cerebro" (Semanas 1-2)**
Establecer los cimientos del sistema para recibir y normalizar inputs de Voz y WhatsApp.

**Objetivos**:
- Motor de Voz: OpenAI Realtime API o Vapi con System Prompt configurado
- Motor de WhatsApp: Integración con Meta Business API
- Orquestador centralizado que normaliza ambos canales
- Base de datos de sesiones en Supabase/PostgreSQL
- Lógica RAG para consultar inventario antes de confirmar ingredientes

**Tecnologías**:
- OpenAI Realtime API / Vapi.ai
- Meta WhatsApp Business API
- PostgreSQL / Supabase
- Claude 3.5 Sonnet para procesamiento
- WebSockets para comunicación bidireccional

---

### **FASE 2: Motor de Voz e Integración de Canales (Sprint 1: Días 1-7)**
**"La Fontanería"** - Hacer que el servidor escuche el mundo exterior.

**Tareas**:
1. **Canal Texto (WhatsApp)**
   - Configurar cuenta en Meta for Developers
   - Levantar servidor local con ngrok
   - Recibir y parsear Webhooks de Meta
   - ✅ Criterio de Éxito: Enviar un WhatsApp y que aparezca en pantalla del servidor

2. **Canal Voz (Telefonía SIP)**
   - Contratar número virtual en Twilio
   - Configurar flujo de audio bidireccional vía WebSockets
   - Encaminar llamadas al servidor
   - ✅ Criterio de Éxito: Llamar al número y escuchar un tono de reconocimiento

3. **Base de Datos (Supabase)**
   - Crear proyecto
   - Tablas mínimas: `sesiones_activas`, `historial_mensajes`, `estado_pedido`
   - ✅ Criterio de Éxito: Registrar una sesión y consultarla

---

### **FASE 3: Cerebro IA y Motor de Voz (Sprint 2: Días 8-14)**
**"La Inteligencia"** - Convertir código en asistente comercial.

**Tareas**:
1. **System Prompt Maestro**
   - Inyectar catálogo completo de la hamburguesería (JSON)
   - Definir guardrails: no inventar productos, no autorizar descuentos, solo hablar de comida
   - Configurar tono y personalidad

2. **Transmisión de Voz de Baja Latencia**
   - Speech-to-Text ultrarrápido: Deepgram
   - Procesar con Claude/GPT
   - Text-to-Speech: ElevenLabs Turbo
   - ✅ Criterio de Éxito: Respuesta completa en < 1.5 segundos

3. **Pruebas de Conversación**
   - Pedidos complejos (múltiples ítems, cambios, alérgenos)
   - Interrupciones del usuario
   - VAD (Voice Activity Detection) funcionando

---

### **FASE 4: El Puente TPV y Function Calling (Sprint 3: Días 15-21)**
**"La Conexión"** - El bot aprende a inyectar pedidos en el TPV del restaurante.

**Tareas**:
1. **Function Calling (LLM)**
   - Configurar herramientas que genera el LLM al confirmar pedido
   - Output estructurado: IDs de productos, cantidades, notas especiales

2. **Adaptadores TPV**
   - Mapear JSON del LLM → Formato API del TPV (Revo, Square, Toast, etc.)
   - Manejo de errores y reintentos
   - Fallback: Si no hay integración, enviar a KDS propio

3. **Gestión de Errores**
   - API del TPV saturada → Disculpa automática al cliente
   - Notificación al dueño del local
   - Reintento automático

---

### **FASE 5: Pagos y Despliegue Piloto (Sprint 4: Días 22-28)**
**"El Cierre"** - Sistema completo, testeo destructivo, lanzamiento piloto.

**Tareas**:
1. **Pasarela de Pago (Stripe)**
   - Generar enlace de pago único por pedido
   - Enviar link por WhatsApp al cliente
   - Webhook de confirmación de pago

2. **Regla de Oro**
   - El pedido solo se envía al TPV DESPUÉS de recibir confirmación de pago en Stripe
   - Estado: `pagado` → Enviar a TPV

3. **QA Destructivo**
   - Simular acentos difíciles, ruidos, cambios de opinión
   - Test de carga (40+ burgers en un pedido)
   - Monitoreo en sombra durante fin de semana piloto

4. **Lanzamiento (Día 28)**
   - Conexión a número real del restaurante
   - Monitoreo en vivo del primer fin de semana

---

## 🎯 Criterios de Éxito por Fase

| Fase | Criterio | Evidencia |
|------|----------|-----------|
| **1** | Servidor recibe inputs de ambos canales | Logs en consola mostrando mensajes de WhatsApp y audio de Twilio |
| **2** | Respuesta de voz en < 1.5s | Cronómetro desde pregunta hasta respuesta audible |
| **3** | Pedido se crea en TPV automáticamente | Captura de pantalla del TPV mostrando orden creada por la IA |
| **4** | Pago confirmado antes de enviar a cocina | Webhook de Stripe antes de POST a TPV |
| **5** | Sistema operativo 24/7 en restaurante real | Monitoreo de uptime y cero pedidos perdidos |

---

## ⚡ Prioridades

1. **Crítico (P0)**: Integración TPV funcional
2. **Alto (P1)**: Voz de baja latencia con interrupción
3. **Medio (P2)**: Dashboard de administración
4. **Bajo (P3)**: Analítica avanzada, historial de llamadas

---

## 📡 Tecnologías Base

Todas definidas en `tech_stack.md`

---

## 🔄 Próximos Pasos Inmediatos

1. Definir el schema de la entidad `Order` (Pedido)
2. Seleccionar TPV piloto para integración
3. Crear repositorio y estructura de proyecto
4. Asignar sprints a desarrolladores
