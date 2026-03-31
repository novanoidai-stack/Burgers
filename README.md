# 🍔 Burger-AI — AI-Powered Restaurant Ordering System

**Status**: Planning Phase Complete → Sprint 1 Ready (2026-04-01)

---

## 🎯 What is This?

Burger-AI is a **4-sprint, 28-day project** to build an autonomous ordering system for burger restaurants that:

1. **Takes orders via Voice** (Twilio SIP + Claude AI + natural conversation)
2. **Takes orders via WhatsApp** (Meta Business API)
3. **Integrates with POS systems** (Revo, Square, Toast, or custom KDS)
4. **Handles payments** (Stripe + Mercado Pago)
5. **Notifies customers** via WhatsApp ("Your burger is ready!")

**Team**: 2 developers
**Timeline**: April 1-28, 2026
**Target**: Operational in one pilot burger restaurant

---

## 📊 Current Status

```
✅ Architecture locked
✅ Tech stack decided (Node.js + Twilio + Deepgram + ElevenLabs + Claude)
✅ Schema defined (Order object)
✅ Decisions documented in vault

⏳ Sprint 1 starts: 2026-04-01 (tomorrow)
```

---

## 🚀 Quick Start

### First Time? Start Here

1. **Read `START_HERE.md`** (5 min)
   - What we built today
   - Key decisions
   - Tomorrow's plan

2. **Skim `PROJECT_INDEX.md`** (10 min)
   - Where everything is
   - Quick reference

3. **Follow `SPRINT_1_CHECKLIST.md`** (daily)
   - Task-by-task guide
   - Day 1 = Git + Services setup

### Already Familiar?

→ **`docs/vault/current.md`** — Today's status and what's next

---

## 📚 Documentation

### Essential Reading

| File | Time | Purpose |
|------|------|---------|
| `START_HERE.md` | 5 min | Orientation |
| `PROJECT_INDEX.md` | 10 min | Where everything is |
| `SPRINT_1_CHECKLIST.md` | 30 min | Detailed daily tasks |
| `CLAUDE.md` | 2 min | Commands reference |

### Deep Dives

| Folder | Purpose |
|--------|---------|
| `docs/vault/` | **Authoritative source** — decisions, roadmap, tech choices |
| `docs/ANALYSIS_SUMMARY.md` | Full analysis (gap report, risk matrix) |
| `docs/PLUGIN_SETUP.md` | Installing rtk-ai plugin |

---

## 🎯 Architecture Overview

```
WhatsApp + Twilio (Voice)
    ↓
API Gateway (Node.js/Express)
    ↓
[Claude 3.5 Sonnet LLM] [Deepgram STT] [ElevenLabs TTS]
    ↓
PostgreSQL via Supabase
    ↓
[TPV Adapters] [Stripe Payments] [Monitoring]
```

**Key Insight**: Everything revolves around a single `Order` object (JSON Schema).

---

## 📅 Timeline

| Sprint | Dates | Goal | Status |
|--------|-------|------|--------|
| **1** | Apr 01-07 | Infrastructure (WhatsApp + Twilio + DB) | ⏳ Starts tomorrow |
| **2** | Apr 08-14 | AI Brain (LLM + Voice latency) | 🔲 Pending |
| **3** | Apr 15-21 | TPV Integration | 🔲 Pending |
| **4** | Apr 22-28 | Payments + Launch | 🔲 Pending |

---

## 🔑 Key Decisions (Locked)

### Backend
- **Language**: Node.js + TypeScript
- **Framework**: Express
- **Why**: Best WebSocket + audio performance

### Voice
- **Twilio SIP** (transport)
- **Deepgram** (STT, ~200ms)
- **ElevenLabs Turbo** (TTS, ~300ms)
- **Total latency target**: < 1.5 seconds
- **Why not Vapi.ai**: 3-5x more expensive, less control

### Database
- **Supabase** (PostgreSQL)
- **Why**: ACID transactions needed for payment safety

---

## 📊 Data Schema

**File**: `src/schemas/order.json`

Every order flowing through the system has this structure:

```json
{
  "order": {
    "id": "ORD-20260401-00001",
    "channel": "voice" | "whatsapp",
    "client": { "phone", "name", "email" },
    "delivery": { "type": "takeaway|delivery|table", "address", "table_number" },
    "items": [{ "product_id", "modifications", "subtotal" }],
    "summary": { "subtotal", "tax", "delivery_fee", "total" },
    "payment": { "status": "pending|paid|failed", "method", "stripe_link" },
    "state": "pending|confirmed|paid|sent_to_tpv|ready|completed",
    "restaurant_config": { "restaurant_id", "allows_delivery", "delivery_zones" }
  }
}
```

---

## ⚡ Commands

```bash
# Development
npm run dev              # Start local server
npm test               # Run tests
npm run lint           # Check code

# Database
npm run db:migrate     # Run Supabase migrations
npm run db:seed        # Load test data

# Docker
docker-compose up      # Full local stack
```

More details: See `CLAUDE.md`

---

## 🎓 Important Concepts

### Input Normalization
- Voice and WhatsApp both normalize into single `Order` object
- Avoids duplicated logic

### Adapter Pattern (TPV)
- Each POS system gets its own `TPVAdapter` class
- Adding new POS = new adapter class (not modifying existing code)

### Full-Duplex Voice with VAD
- User can interrupt AI mid-sentence
- Deepgram's VAD detects user voice in < 50ms
- AI output stops immediately

### Payment-First Rule (Golden Rule)
- Order only sent to kitchen AFTER Stripe confirms payment
- Non-negotiable

---

## 🚨 Critical Things

### Don't Forget
- ✅ `.env.local` must NOT be committed (add to `.gitignore`)
- ✅ Update `docs/vault/current.md` daily
- ✅ Commit daily with meaningful messages
- ✅ Test with real devices (real phone, real WhatsApp)

### Before You Start
- ✅ Read `START_HERE.md`
- ✅ Have Node.js 18+ installed
- ✅ Plan to create external service accounts (Twilio, Meta, Supabase, etc.)

---

## 🏁 Definition of Done (Sprint 1)

By 2026-04-07 18:00, these must all work:

- [ ] WhatsApp messages trigger webhook → Order object created
- [ ] Twilio call connects → Audio streams to server
- [ ] Deepgram receives audio → Returns transcript
- [ ] Orders persist in Supabase
- [ ] Server runs for 1+ hour without crashes

If all pass → **Sprint 1 complete** → Move to Sprint 2 (LLM + Voice)

---

## 📞 FAQ

**Q: Where's the actual code?**
A: Not written yet. Sprint 1 starts tomorrow (2026-04-01). This is the planning phase.

**Q: How long will this take?**
A: 28 days for MVP (4 sprints × 7 days). Team of 2 developers, 3h/day minimum.

**Q: Can I change the tech stack?**
A: No. Decisions are locked. See `docs/vault/memory.md` for why each choice was made.

**Q: What's the cost?**
A: Services use free tiers. Twilio ~$1/month, Deepgram free 50k/min, ElevenLabs may need paid plan ($5+/month).

**Q: What if I get stuck?**
A: Document in `docs/vault/current.md` blockers section. Follow `SPRINT_1_CHECKLIST.md` escalation steps.

---

## 📖 File Guide

```
burger-ai/
├── START_HERE.md ← Read this first!
├── PROJECT_INDEX.md ← File guide
├── README.md ← This file
├── CLAUDE.md ← Commands
├── SPRINT_1_CHECKLIST.md ← Daily tasks
│
├── docs/vault/ ← Authoritative source
│   ├── current.md ← TODAY'S STATUS
│   ├── roadmap.md ← 4-sprint plan
│   ├── tech_stack.md ← Tech choices
│   └── memory.md ← Why we chose X
│
├── src/schemas/order.json ← Data contract
└── .env.example ← Copy to .env.local (never commit)
```

---

## 🎯 Next Step

**Tomorrow morning**:
1. Open `START_HERE.md`
2. Follow `SPRINT_1_CHECKLIST.md` for Day 1 tasks
3. Good luck! 🚀

---

**Project Created**: 2026-03-31
**Status**: Ready for Sprint 1
**Last Updated**: 2026-03-31

---

*Built with ❤️ by Claude Code + your architecture*
