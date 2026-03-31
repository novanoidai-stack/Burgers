# 📚 Burger-AI Project Index

**Última actualización**: 2026-03-31
**Estado**: Planning → Ready for Sprint 1 (mañana)

---

## 🎯 Start Here

1. **`START_HERE.md`** ← **Read this first** if you're starting the project
   - What happened today
   - Key decisions
   - First day tasks

2. **`SPRINT_1_CHECKLIST.md`** ← **Follow this day-by-day**
   - Pre-Sprint 1 setup (services)
   - Daily tasks (Días 1-7)
   - Success criteria

---

## 📖 Documentation Structure

### Vault (Authoritative Source of Truth)
Located: `docs/vault/`

| File | Purpose | When to Read |
|------|---------|--------------|
| **`current.md`** | Current project state, blockers, next steps | **Daily** — update after work |
| **`roadmap.md`** | 4-sprint master plan (28 days to MVP) | Planning phase, every sprint |
| **`tech_stack.md`** | Technology choices with rationale | When choosing tools |
| **`memory.md`** | Architectural decisions & why | Before proposing changes |

### Project Setup
| File | Purpose | Status |
|------|---------|--------|
| **`CLAUDE.md`** | Commands (npm, tests, etc) for Claude Code | ✅ Ready (Node.js) |
| **`.env.example`** | Environment variables template | ✅ Complete |
| **`PLUGIN_SETUP.md`** | How to install rtk-ai plugin | ✅ Complete |

### Analysis & Planning
| File | Purpose | Details |
|------|---------|---------|
| **`ANALYSIS_SUMMARY.md`** | Executive summary of analysis | ✅ Completed 2026-03-31 |
| **`docs/vault/roadmap.md`** | 4-sprint roadmap | ✅ Locked |

### Checklists
| File | Purpose | When Used |
|------|---------|-----------|
| **`SPRINT_1_CHECKLIST.md`** | Daily tasks for Sprint 1 | 2026-04-01 to 04-07 |
| **`START_HERE.md`** | Quick orientation guide | Day 1 morning |

---

## 🔑 Key Decisions (Locked)

### Technical Choices

| Decision | Chosen | Registered |
|----------|--------|-----------|
| Backend Language | **Node.js + TypeScript** | `memory.md` ✅ |
| Voice System | **Twilio SIP + Deepgram + ElevenLabs** | `memory.md` ✅ |
| Database | **PostgreSQL via Supabase** | `memory.md` ✅ |
| LLM | **Claude 3.5 Sonnet** | `memory.md` ✅ |
| Payments | **Stripe (primary) + Mercado Pago** | `memory.md` ✅ |

### Architecture Patterns

| Pattern | Use Case | Where |
|---------|----------|-------|
| **Input Normalization** | Voice + WhatsApp both → Order object | `memory.md` |
| **Adapter Pattern** | TPV integrations (Revo/Square/Toast) | `tech_stack.md` |
| **Full-Duplex + VAD** | User can interrupt AI mid-response | `tech_stack.md` |
| **Payment-First Rule** | Order only to kitchen AFTER Stripe confirms | `memory.md` |

---

## 📊 Data Schema

**File**: `src/schemas/order.json`
**Format**: JSON Schema v7 (auto-validating)

**Purpose**: Single contract used by:
- AI (receives voice/text, generates Order)
- Database (stores Order)
- TPV (receives Order)
- Payments (validates Order)
- Dashboard (displays Order)

**Key fields**:
```json
{
  "order": {
    "id": "ORD-YYYYMMDD-XXXXX",
    "channel": "voice | whatsapp",
    "client": { "phone", "name", "email" },
    "delivery": { "type": "takeaway|delivery|table", "address", "table_number" },
    "items": [{ "product_id", "modifications", "subtotal" }],
    "summary": { "subtotal", "tax", "delivery_fee", "total" },
    "payment": { "status", "method", "stripe_link" },
    "state": "pending | ... | completed",
    "restaurant_config": { "restaurant_id", "allows_delivery", "delivery_zones" }
  }
}
```

---

## 🏗️ Project Structure

```
burger-ai/
├── START_HERE.md ← Read this first
├── SPRINT_1_CHECKLIST.md ← Follow this daily
├── PROJECT_INDEX.md ← This file
├── CLAUDE.md ← Commands reference
│
├── .env.example ← Copy to .env.local (never commit)
│
├── docs/
│   ├── vault/ ← AUTHORITATIVE SOURCE
│   │   ├── current.md ← Status (update daily)
│   │   ├── roadmap.md ← 4-sprint plan
│   │   ├── tech_stack.md ← Tech decisions
│   │   └── memory.md ← Why we chose X
│   │
│   ├── ANALYSIS_SUMMARY.md ← Analysis results
│   └── PLUGIN_SETUP.md ← rtk-ai installation
│
├── src/
│   ├── backend/ ← Create in Sprint 1
│   │   ├── routes/
│   │   ├── services/
│   │   └── db/
│   │
│   ├── frontend/ ← Create in Sprint 2
│   │
│   └── schemas/
│       └── order.json ✅ (ready)
│
└── tests/ ← Create in Sprint 1
```

---

## 📅 Timeline

### Current Phase: Planning ✅

- ✅ Roadmap defined (4 sprints / 28 days)
- ✅ Tech stack locked
- ✅ Architecture decided
- ✅ Order schema created
- ✅ Decisions documented

### Next Phase: Sprint 1 (2026-04-01 to 04-07)

**Goal**: Infrastructure ready
- WhatsApp webhook receiver
- Twilio SIP + WebSocket audio handler
- Supabase database + migrations
- Deepgram STT integration (prep)

**Team**: 2 developers, 3h/day minimum each

### Sprint 2 (2026-04-08 to 04-14)

**Goal**: AI brain + voice working
- Claude LLM + function calling
- Full voice latency testing
- System prompt with menu

### Sprint 3 (2026-04-15 to 04-21)

**Goal**: TPV integration
- Adapter pattern implementation
- Revo/Square/Toast connectors
- Error handling + fallback KDS

### Sprint 4 (2026-04-22 to 04-28)

**Goal**: Payments + launch
- Stripe integration complete
- Destructive QA testing
- Pilot restaurant deployment

---

## 📞 Important Contacts

| Role | Status | Action |
|------|--------|--------|
| Architect | ✅ You | Documented |
| DEV 1 (Backend/DB) | ⏳ Pending | Assign |
| DEV 2 (Voice/AI) | ⏳ Pending | Assign |
| Pilot Restaurant | ❌ Not identified | **Contact THIS WEEK** |

---

## 🚨 Critical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **TPV not identified** | MEDIUM | HIGH | Contact restaurant this week |
| **Voice latency > 1.5s** | LOW | HIGH | Test in Sprint 2, not Sprint 4 |
| **Service credentials fail** | MEDIUM | CRITICAL | Verify each credential on Day 1 |
| **WebSocket timeout** | LOW | MEDIUM | Check ngrok + firewall |

---

## ✅ Completion Checklist

### By End of Today (2026-03-31)
- [x] Analysis completed
- [x] Decisions locked
- [x] Schema created
- [x] Documentation prepared

### By Start of Sprint 1 (2026-04-01)
- [ ] GitHub repo created
- [ ] All service credentials obtained
- [ ] `.env.local` filled
- [ ] Node.js project initialized

### By End of Sprint 1 (2026-04-07)
- [ ] WhatsApp webhook working
- [ ] Twilio audio streaming working
- [ ] Supabase database set up
- [ ] Deepgram STT functional (MVP)

---

## 🔍 Quick Reference

### "Where do I find...?"

| Question | Answer |
|----------|--------|
| How do I run the server? | `CLAUDE.md` (npm run dev) |
| What's the day 1 plan? | `SPRINT_1_CHECKLIST.md` (Pre-Sprint 1 section) |
| What are the tech choices? | `docs/vault/tech_stack.md` |
| Why did we choose Node.js? | `docs/vault/memory.md` (Decision 1) |
| Where's the Order schema? | `src/schemas/order.json` |
| What's blocked us? | `docs/vault/current.md` (Status section) |
| What's the current state? | `docs/vault/current.md` (Estado del Proyecto) |
| How to install rtk-ai plugin? | `docs/PLUGIN_SETUP.md` |

---

## 📝 How to Update This Project

### Daily (every work session)
1. Read `docs/vault/current.md` first
2. Do your work
3. Update `current.md` with progress
4. Commit with meaningful message
5. Never commit `.env.local` or secrets

### After each Sprint
1. Update `docs/vault/current.md` with new status
2. Register new decisions in `docs/vault/memory.md`
3. Update `docs/vault/roadmap.md` if needed

### Architecture Decision
1. Before implementing: Check `memory.md` for prior decisions
2. If new decision needed: Document in `memory.md` with Why + How to Apply

---

## 🎓 Philosophy

> **This is a persistent memory system.**
>
> Every decision is documented so the team doesn't repeat discussions.
> Every failure is documented so we don't repeat mistakes.
> Every success is documented so we can replicate it.
>
> **Investment of 1 hour in documentation = 10 hours saved in debugging.**

---

## 📞 Need Help?

- **Current status**: Read `docs/vault/current.md`
- **How to build**: Read `CLAUDE.md`
- **What to do next**: Read `SPRINT_1_CHECKLIST.md`
- **Why we chose X**: Read `docs/vault/memory.md`
- **Where things break**: Check GitHub Issues + `current.md` blockers

---

## ✨ Summary

**You have**:
- ✅ Locked architecture
- ✅ Clear sprint plan
- ✅ Data schema defined
- ✅ Technology stack chosen
- ✅ Risk matrix documented
- ✅ Daily checklists prepared

**You are ready to start Sprint 1 tomorrow.**

**Next step**: Open `START_HERE.md` and follow from there.

---

**Created**: 2026-03-31
**Status**: Complete & Ready for Implementation
**Next Review**: 2026-04-08 (end of Sprint 1)
