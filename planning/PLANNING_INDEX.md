# 📋 PLANNING NOVO BURGER — Índice

**Fecha creación**: 2026-04-20 **Versión**: 1.0 **Estado**: Listo para comenzar

---

## ¿QUÉ ES ESTO?

Estos son los **planes detallados para desarrollar Novo Burger en 7 semanas**. Cada semana tiene su propio archivo con tareas, tests y commits.

**OBJETIVO**: Que cuando le digas a Claude Code:

"Lee planning\_SEMANA\_1.md y desarrolla el Paso 1.1"

Él tenga TODO el contexto necesario y lo haga sin que tengas que explicar paso a paso.

---

## ESTRUCTURA

planning/

├── PLANNING\_INDEX.md          ← Este archivo

├── PLAN\_SEMANA\_1.md          ← WhatsApp MVP (7 días)

├── PLAN\_SEMANA\_2.md          ← Retell AI \- Voz (7 días)

├── PLAN\_SEMANA\_3.md          ← Stripe \- Pagos (7 días)

├── PLAN\_SEMANA\_4.md          ← React Dashboard (7 días)

└── PLAN\_SEMANAS\_5\_7.md       ← AI, Testing, Launch (21 días)

---

## CÓMO USAR ESTOS PLANES

### Flujo de trabajo

1. **Lee el plan correspondiente** (ej: PLAN\_SEMANA\_1.md)  
2. **Pega este prompt en Claude Code**:

📋 PROMPT PARA CLAUDE CODE:

Lee el archivo planning/PLAN\_SEMANA\_1.md completamente.

Ahora, desarrolla el Paso \[X\] (describe qué paso quieres).

Crea/modifica todos los archivos necesarios.

3. **Claude lo hace sin que tengas que explicar en detalle**  
4. **Prueba localmente** con `npm run dev`  
5. **Pushea a GitHub** cuando esté listo

---

## RESUMEN DE SEMANAS

### SEMANA 1 — WhatsApp MVP

**Qué haces**: Servidor Express → Webhook WhatsApp → Claude API → Respuestas automáticas

**Resultado**: Clientes envían mensajes de WhatsApp y el bot les contesta automáticamente, toma pedidos.

**Archivos clave**:

- `src/server.ts` — Express app  
- `src/services/supabase.ts` — BD  
- `src/services/whatsapp.ts` — Integración Meta  
- `src/services/claude.ts` — Claude AI

---

### SEMANA 2 — Retell AI (Voz)

**Qué haces**: Integrar Retell AI para que clientes puedan llamar por teléfono.

**Resultado**: Clientes llaman, Claude entiende, responde con voz automáticamente.

**Archivos clave**:

- `src/services/retell.ts` — Integración Retell  
- `src/routes/voice.ts` — Rutas de voz

---

### SEMANA 3 — Stripe (Pagos)

**Qué haces**: Generar links de pago, procesar pagos, marcar pedidos como pagados.

**Resultado**: Después de confirmar un pedido, el cliente recibe un link de pago. Cuando paga, el pedido se marca como "paid" y va a cocina.

**Archivos clave**:

- `src/services/stripe.ts` — Integración Stripe  
- `src/routes/payments.ts` — Webhooks de pago

---

### SEMANA 4 — React Dashboard

**Qué haces**: Crear un panel web para que el dueño del restaurante vea pedidos en tiempo real y gestione el menú.

**Resultado**: Admin accede a `dashboard.novo-burger.com`, ve los pedidos en vivo, cambia status, edita menú.

**Archivos clave**:

- `src/frontend/` — Todo el React  
- `src/routes/orders.ts` — API para pedidos  
- `src/routes/menu.ts` — API para menú

---

### SEMANA 5 — AI Improvements

**Qué haces**: Claude recuerda clientes, sugiere items, maneja modificaciones, multi-idioma.

**Resultado**: Sistema es más inteligente y personalizado.

---

### SEMANA 6 — Testing

**Qué haces**: Suite de tests exhaustiva, coverage \> 70%, bugs arreglados.

**Resultado**: Sistema es estable y confiable.

---

### SEMANA 7 — Launch

**Qué haces**: Deploy en producción (Railway), configurar webhooks reales, tests en vivo.

**Resultado**: Sistema funciona en producción 24/7, clientes reales pueden usarlo.

---

## CÓMO LEER CADA PLAN

Cada archivo de plan tiene esta estructura:

\# 📋 PLAN SEMANA X

\[Objetivo y nota sobre prerequisitos\]

\#\# ESTADO ACTUAL

\[Checklist de lo que hay que completar\]

\#\# PRE-REQUISITOS

\[Cuentas, API keys, etc.\]

\#\# TAREAS

\[Cada tarea numerada con:\]

\- Qué hacer

\- Qué archivo crear/modificar

\- Funciones específicas

\- Parámetros

\#\# TEST DE ÉXITO

\[Cómo verificar que funciona\]

\#\# COMMIT

\[Comando git exacto\]

\#\# ERRORES COMUNES

\[Soluciones para problemas típicos\]

---

## PROMPT ESTÁNDAR PARA CLAUDE CODE

Cada vez que quieras desarrollar una semana:

📋 PROMPT PARA CLAUDE CODE:

Lee el archivo planning/PLAN\_SEMANA\_X.md completamente.

Ahora, desarrolla el Paso X.Y (describe qué hay que hacer).

Crea/modifica todos los archivos necesarios. Sigue exactamente lo que dice el plan.

Asegúrate de:

1\. TypeScript strict (sin any)

2\. Try/catch en funciones async

3\. Logging apropiado

4\. Validación de entradas

---

## CHECKLIST GENERAL

### Antes de empezar Semana 1

- [ ] Node.js instalado  
- [ ] Antigravity abierto con proyecto  
- [ ] .env.local con variables básicas  
- [ ] `npm install` corrió sin errores  
- [ ] `npm run dev` arranca servidor

### Después de cada semana

- [ ] Todos los tests pasan  
- [ ] Funcionan manualmente con WhatsApp/llamadas  
- [ ] Código pusheado a GitHub  
- [ ] memory/CURRENT\_STATUS.md actualizado  
- [ ] Commit con mensaje claro

### Requisitos antes de producción

- [ ] Semanas 1-4 completas  
- [ ] Coverage \> 70%  
- [ ] Todos los bugs arreglados  
- [ ] Documentación actualizada

---

## CUENTAS Y CREDENCIALES NECESARIAS

Por semana:

| Semana | Servicio | URL | Estado |
| :---- | :---- | :---- | :---- |
| 0 | GitHub | github.com/novanoidai-stack/Burgers | ✅ Tienes |
| 1 | Supabase | supabase.com | Crea en Semana 1 |
| 1 | Meta | developers.facebook.com | Crea en Semana 1 |
| 1 | Anthropic | console.anthropic.com | Crea en Semana 1 |
| 1 | ngrok | ngrok.com | Crea en Semana 1 |
| 2 | Retell AI | retellai.com | Crea en Semana 2 |
| 3 | Stripe | stripe.com | Crea en Semana 3 (TEST mode) |
| 7 | Railway | railway.app | Crea en Semana 7 para deploy |

---

## ERRORES COMUNES (TODAS LAS SEMANAS)

### "npm run dev no funciona"

1. Verifica que .env.local existe y tiene todas las variables  
2. Verifica que `src/index.ts` existe  
3. Verifica que package.json tiene el script "dev" correcto

### "Variables de entorno no cargadas"

1. .env.local debe estar en la raíz del proyecto (C:...\\burgers.env.local)  
2. Nunca comitea .env.local (debe estar en .gitignore)  
3. Reinicia `npm run dev` después de cambiar .env.local

### "Webhook no se verifica"

1. ¿ngrok está corriendo? (`ngrok http 3001`)  
2. ¿ngrok URL está actualizada en Meta/Stripe? (cambia cada vez que reinicias)  
3. ¿El token es el mismo en .env.local y en la plataforma?

### "Tests no pasan"

1. Verifica que jest está instalado  
2. Verifica que los mocks funcionen  
3. Revisa los logs de error

### "Claude Code gasta muchos tokens"

- Lee el plan ENTERO antes de pedir cambios  
- Describe exactamente qué quieres (con números de tarea)  
- No pidas cambios parciales, piensa todo y pide de una

---

## PRÓXIMOS PASOS

1. **Descarga/copia estos 5 archivos** a tu proyecto:  
     
   - planning/PLANNING\_INDEX.md (este)  
   - planning/PLAN\_SEMANA\_1.md  
   - planning/PLAN\_SEMANA\_2.md  
   - planning/PLAN\_SEMANA\_3.md  
   - planning/PLAN\_SEMANA\_4.md  
   - planning/PLAN\_SEMANAS\_5\_7.md

   

2. **Crea la carpeta** `planning/` en la raíz del proyecto  
     
3. **Pushea todo a GitHub**:  
     
   git add planning/  
     
   git commit \-m "docs: agregar planes detallados para 7 semanas"  
     
   git push origin main  
     
4. **Empieza Semana 1** leyendo `PLAN_SEMANA_1.md`

---

## CONTACTO / AYUDA

Si algo no funciona:

1. Busca en la sección "ERRORES COMUNES" del plan  
2. Si no está, pega el error en Claude Code:  
     
   Estoy en la Semana X, Paso Y. Este error pasó:  
     
   \[ERROR\]  
     
   Arréglalo.  
     
3. Claude mirará el plan y el error, y lo solucionará

---

**¡Buena suerte\! El MVP de Novo Burger te espera en 7 semanas. 🍔🚀**

---

**Última actualización**: 2026-04-20 **Versión**: 1.0 — Definitiva  
