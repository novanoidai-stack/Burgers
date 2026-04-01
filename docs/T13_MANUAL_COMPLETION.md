# 🧪 T13: Smoke Test Manual - Instrucciones de Compleción

**Fecha**: 2026-04-01
**Estado**: F2 70% completado, código sólido, fixes P0-P1 aplicados
**Tests**: 37/37 PASS
**Compilación**: 0 errores TypeScript

---

## 📋 RESUMEN EJECUTIVO

✅ **Análisis Profundo de Código (Opción 3) - COMPLETO**
- Identificados y corregidos bugs críticos de Stripe
- Análisis completo de todas las capas del sistema
- Documentación técnica completa en `memory/code_analysis_findings.md`

✅ **Fixes P0-P1 - COMPLETO**
- Stripe API version corregido
- LLM menu filtering bug corregido
- Todos los tests siguen pasando (37/37 PASS)
- Commit: `1fb133e`

⚠️ **Smoke Test Manual (T13) - REQUIERE INTERACCIÓN MANUAL**
- El servidor está configurado correctamente
- Variables de entorno en `.env.local` existen
- Requiere arrancar servidor manualmente y hacer pruebas

---

## 🔧 PASO A PASO: COMPLETAR T13 MANUALMENTE

### **Paso 1: Arrancar Servidor Manualmente**

**Opción A (Recomendada): Usar tu terminal local**
```bash
cd C:\Users\carli\OneDrive\Escritorio\Burgers
npm run dev
```

**Opción B: Si hay problemas de variables de entorno**
```bash
# En PowerShell (Windows)
$env:SUPABASE_URL="https://nxfilmjrrxbyfhzkqrmt.supabase.co"
$env:SUPABASE_ANON_KEY="eyJhbGci..."
$env:SUPABASE_SERVICE_KEY="eyJhbGci..."
$env:JWT_SECRET="novo-food-dev-jwt-secret-32-chars-min!!"
$env:DEEPGRAM_API_KEY="d2ad73dc..."
$env:TWILIO_ACCOUNT_SID="AC75be78..."
$env:TWILIO_AUTH_TOKEN="eb83209..."
$env:TWILIO_PHONE_NUMBER="+19384653399"
$env:OPENROUTER_API_KEY="sk-or-v1-88f8..."
$env:ELEVENLABS_API_KEY="1a8d..."
$env:ELEVENLABS_VOICE_ID="21m00Tcm4TlvDq8ikWAM"
$env:STRIPE_SECRET_KEY="sk_test_51..."
$env:STRIPE_WEBHOOK_SECRET="PENDIENTE"
$env:PORT="3000"
npm run dev
```

**Expected Output**:
```
Novo Food API listening on port 3000 [development]
```

---

### **Paso 2: Exponer con ngrok**

**En otra terminal:**
```bash
# En PowerShell
npx ngrok http 3000
```

**Anota la URL pública** (ej: `https://abc123.ngrok.io`)

---

### **Paso 3: Configurar Twilio Webhook (CRÍTICO PARA VOZ)**

1. Abre Twilio Console: https://console.twilio.com
2. Ve a: Phone Numbers → +1(938)465-3399
3. En "Voice Configuration" → Webhook:
   - **Webhook URL**: `https://[tu-ngrok-url]/twiml/voice/001`
   - **HTTP Method**: POST
4. Guarda cambios

---

### **Paso 4: Test de Voz**

**Acción**: Llama al número **+1 (938) 465-3399** desde tu móvil

**Expected**:
- ✅ La IA saluda en español en <3 segundos
- ✅ Logs del servidor muestran:
  ```
  [voice] New call for tenant: 001
  [voice][001] Stream started: MZ...
  [voice][001] Deepgram connection opened
  [voice][001] Transcript: "hola"
  ```
- ✅ Puedes hablar con la IA
- ✅ IA responde usando ElevenLabs TTS

**Si funciona**: ✅ **CANAL DE VOZ VERIFICADO**

---

### **Paso 5: Test de WhatsApp (Si Evolution API está corriendo)**

**Requisito**: Evolution API debe estar corriendo en tu máquina

**Acción**: Envía un mensaje al número de WhatsApp configurado
- Texto: "Hola, quiero una Super Smash Bros"

**Expected**:
- ✅ El servidor recibe el mensaje
- ✅ IA responde por WhatsApp
- ✅ Puedes completar un pedido

**Si funciona**: ✅ **CANAL DE WHATSAPP VERIFICADO**

---

### **Paso 6: Verificar en Supabase**

**Abre SQL Editor en Supabase**: https://nxfilmjrrxbyfhzkqrmt.supabase.co

**Ejecuta esta query**:
```sql
SELECT
  id,
  status,
  phone_number,
  order_draft,
  created_at
FROM restaurant_001.sessions
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**:
- ✅ Ver filas con `status = 'taking_order'` o `'awaiting_payment'`
- ✅ Ver `order_draft` con items añadidos
- ✅ Ver menú seedeado (20 productos El Mesón)

---

## 📋 CHECKLIST DE COMPLETACIÓN

**Verifica cada item antes de proceder al siguiente paso:**

- [ ] **Servidor arranca** en tu terminal local
- [ ] **Ngrok URL pública** generada y anotada
- [ ] **Twilio webhook configurado** apunta a tu ngrok URL
- [ ] **Test de voz exitoso** - IA saluda en español
- [ ] **Test de WhatsApp exitoso** (si Evolution API corriendo)
- [ ] **Supabase muestra sesiones** con pedidos
- [ ] **Logs del servidor** sin errores críticos

---

## 🎯 CRITERIO DE ÉXITO DE T13

**T13 está COMPLETO cuando**:
1. ✅ Al menos UN canal funciona (voz O WhatsApp)
2. ✅ IA responde en español
3. ✅ Puedes interactuar (hacer preguntas, añadir items al pedido)
4. ✅ Los datos se guardan en Supabase correctamente
5. ✅ No hay errores críticos en logs

---

## 🏁 COMPLETAR F2: TAG + PUSH

**Una vez T13 confirmado exitosamente, ejecuta estos comandos:**

```bash
# En tu terminal, en C:\Users\carli\OneDrive\Escritorio\Burgers

# 1. Verificar que todo está commiteado
git status

# 2. Tag F2 como completo
git tag -a f2-complete -m "F2: Cerebro IA completo - 70% de implementación + fixes P0-P1 aplicados
- Voice route: Deepgram → LLM → ElevenLabs TTS pipeline
- WhatsApp route: Text → LLM → Evolution API reply
- Stripe webhook: Payment confirmation → session status update
- Tests: 37/37 PASS
- Compilación: 0 errores TypeScript"

# 3. Push al remoto
git push origin master

# 4. Push tags
git push origin master --tags
```

**Expected**: Ver el tag `f2-complete` en GitHub

---

## 📊 ESTADO FINAL ESPERADO

```
┌─────────────────────────────────────────────────────────┐
│  F2: CEREBRO IA - ✅ COMPLETO                       │
│                                                         │
│  ✅ T1-T9: Infraestructura F1 (19 tests PASS)       │
│  ✅ T10: Voice route wiring (completo)                │
│  ✅ T11: WhatsApp route wiring (completo)               │
│  ✅ T12: Stripe webhook route (completo)                │
│  ✅ T13: Smoke test manual (verificado)                  │
│                                                         │
│  ⚠️ F3: TPV Integration - PRÓXIMO FASE                │
│                                                         │
│  Tags: f2-complete                                      │
│  Tests: 37/37 PASS                                     │
│  Compilación: 0 errores                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 PRÓXIMOS PASOS (F3)

**Una vez F2 completado, el próximo es F3: TPV Integration**

**F3 incluirá**:
- Identificación de TPV piloto (Revo/Square/Toast/Legacy)
- Implementación de `TPVAdapter` pattern
- Mapeo de Orders → formato API del TPV
- Manejo de errores + fallback KDS
- Integration tests con TPV mock

**Documentación a revisar**: `docs/vault/roadmap.md` (Sprint 3: Fase 4 - El Puente TPV)

---

## 💡 NOTAS IMPORTANTES

1. **Variables de entorno**: Si tienes problemas arrancando el servidor, verifica que `.env.local` esté en la raíz del proyecto y que los valores son correctos.

2. **Twilio Webhook**: La URL del webhook DEBE apuntar a tu ngrok URL, no a localhost:3000, porque Twilio está en la nube.

3. **Logs**: Si hay errores durante el smoke test, revisa los logs en tu terminal donde corre `npm run dev`.

4. **Network**: Asegúrate de tener conexión a internet (ngrok, Twilio, Supabase, OpenRouter, ElevenLabs, Stripe).

---

**¡Éxito completando F2!** 🎉
