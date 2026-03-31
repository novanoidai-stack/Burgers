# 🚀 START HERE — Burger-AI Sprint 1 Kickoff

**Hoy**: 2026-03-31 (Análisis completado)
**Mañana**: 2026-04-01 (Sprint 1 comienza)

---

## ¿Qué pasó hoy?

✅ **Análisis arquitectónico completo**
- Gap analysis
- Decisiones técnicas bloqueadas
- Risk matrix

✅ **Schema del Pedido definido**
- `src/schemas/order.json` listo para usar
- JSON Schema v7 (validación automática)

✅ **Decisiones críticas tomadas**
- Backend: **Node.js + TypeScript**
- Voz: **Twilio SIP + Deepgram + ElevenLabs**
- Equipo: **2 personas**

✅ **Documentación preparada**
- `CLAUDE.md` — Comandos Node.js
- `.env.example` — Template completo
- `SPRINT_1_CHECKLIST.md` — Tareas día por día
- `docs/vault/memory.md` — Decisiones registradas

---

## 📝 Archivos Clave para Mañana

| Archivo | Propósito | Acción |
|---------|-----------|--------|
| `SPRINT_1_CHECKLIST.md` | ← **LEER ESTO PRIMERO** | Tareas ordenadas por día |
| `src/schemas/order.json` | Contrato de datos | Usarlo en migrations |
| `.env.example` | Template de variables | Copiar a `.env.local` + llenar |
| `docs/vault/current.md` | Estado actual | Actualizar diariamente |
| `CLAUDE.md` | Comandos Node.js | Referencia rápida |
| `docs/PLUGIN_SETUP.md` | Plugin rtk-ai | Leer si necesitas instalarlo |

---

## 🎯 Primer Día (01 Abril) — Estructura de 2h + 4h

### Morning (2h) — DEV 1

```bash
# 1. Create GitHub repo
# 2. Clone locally
# 3. Initialize Node.js project
npm init -y
npm install express ws @supabase/supabase-js typescript ts-node
npm install --save-dev @types/node @types/express nodemon

# 4. Create folder structure
mkdir -p src/backend/routes src/backend/services src/backend/db/migrations
mkdir tests

# 5. Create tsconfig.json (minimal)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "strict": true
  }
}

# 6. Update package.json scripts
# (See SPRINT_1_CHECKLIST.md)

# 7. Test it works
npm run dev
# Expected: Server running on port 3000
```

### Afternoon (4h) — Both + Architect

**Create all external service accounts**:
- [ ] Twilio (number + credentials)
- [ ] Meta WhatsApp (app + token)
- [ ] Supabase (project + keys)
- [ ] Anthropic, Deepgram, ElevenLabs (keys)
- [ ] Stripe (test keys)

**Result**: `.env.local` file (fully filled, never commit)

```bash
# Copy template
cp .env.example .env.local

# Edit and fill all values
nano .env.local  # or VS Code
```

---

## 🗓️ Week Overview

```
Mon 01  ← TODAY: Git + Services setup
Tue 02  ← Supabase migrations + WhatsApp webhook
Wed 03  ← Twilio WebSocket + ngrok tunnel
Thu 04  ← Deepgram STT integration (prep)
Fri 05  ← WhatsApp parsing to Order object
Sat 06  ← Audio streaming to Deepgram
Sun 07  ← Final tests + stabilization
```

**By Sunday 18:00**: All Sprint 1 success criteria must pass.

---

## ⚠️ Critical Path

These MUST work first:

1. **Git + Node.js** (Day 1)
2. **Supabase** (Days 1-2)
3. **Twilio credentials** (Day 1)
4. **Meta credentials** (Day 1)
5. **WebSocket connections** (Days 2-3)

If ANY of these fails → **STOP and escalate** (cannot proceed).

---

## 🎓 Things to Remember

### Don't Forget:

- [ ] `.env.local` goes to `.gitignore` (NEVER commit)
- [ ] Run `npm run dev` before each day starts
- [ ] Check `docs/vault/current.md` for status
- [ ] Update `current.md` daily with progress
- [ ] Commit daily (meaningful messages)

### Update `docs/vault/current.md` daily:

```markdown
## Status Update — 2026-04-02 (Day 2)

**Completed**:
- [ ] Supabase project created
- [ ] Orders table migrated
- [ ] Express server running

**In Progress**:
- [ ] WhatsApp webhook receiver

**Blockers**:
- None yet

**Next**: WhatsApp webhook parsing
```

### Daily Standup (with yourself):

1. What did I finish?
2. What am I doing today?
3. Any blockers?

---

## 📊 Success Looks Like...

**End of Sprint 1 (2026-04-07)**:

```bash
# Terminal 1
npm run dev
# Output:
# > Server running on port 3000
# > Supabase connected ✅
# > Twilio ready ✅
# > WhatsApp ready ✅

# Terminal 2 — Test WhatsApp
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "+34600123456",
            "type": "text",
            "text": {"body": "Hola, quiero una hamburguesa"}
          }]
        }
      }]
    }]
  }'

# Expected output in server:
# Order object: { session_id: '...', channel: 'whatsapp', ... }
```

---

## 🔗 Key Resources

| What | Where |
|------|-------|
| **Tareas diarias** | `SPRINT_1_CHECKLIST.md` |
| **Comandos Node.js** | `CLAUDE.md` |
| **Schema de datos** | `src/schemas/order.json` |
| **Estado del proyecto** | `docs/vault/current.md` |
| **Decisiones técnicas** | `docs/vault/memory.md` |
| **Full roadmap** | `docs/vault/roadmap.md` |

---

## ❓ FAQ

**Q: ¿Qué pasa si algo falla?**
A: Marca en SPRINT_1_CHECKLIST.md, documenta en `current.md`, y escalada a Arquitecto.

**Q: ¿Cuándo empezamos con el LLM?**
A: Sprint 2 (semana siguiente). Sprint 1 es solo "fontanería" (WhatsApp + Twilio + BD).

**Q: ¿Y si los servicios externos son muy caros?**
A: Todos tienen free tier. Anthropic, Deepgram, ElevenLabs, Stripe son free para testing.

**Q: ¿Commit diariamente?**
A: Sí. Small, meaningful commits (no "WIP"). Ej: "Add WhatsApp webhook receiver", "Setup Supabase migrations".

**Q: ¿Qué si ngrok no funciona?**
A: Descargar aquí: https://ngrok.com/download — funciona en Windows 11.

---

## 🚨 Abort Conditions (si esto falla, no continúes)

❌ **Cannot proceed if**:
- Supabase no conecta
- Twilio no genera número
- Node.js server crashes al iniciar
- `.env` variables incorrectas

**If blocked**:
1. Check error message carefully
2. Document in `current.md`
3. Escalate same day

---

## ✨ You're Ready

Everything is prepared. Folders created. Schema defined. Decisions locked.

**Tomorrow morning**:
1. Open `SPRINT_1_CHECKLIST.md`
2. Follow day-by-day
3. Commit daily
4. Update `current.md`

**Good luck!** 🚀

---

## Schedule

- **📅 2026-04-01 to 2026-04-07**: Sprint 1 (infrastructure)
- **📅 2026-04-08 to 2026-04-14**: Sprint 2 (LLM + voice)
- **📅 2026-04-15 to 2026-04-21**: Sprint 3 (TPV integration)
- **📅 2026-04-22 to 2026-04-28**: Sprint 4 (payments + QA + launch)

**MVP ready**: 2026-04-28
