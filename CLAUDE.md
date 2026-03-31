# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Phase & Status

**Current Phase**: Planning & Architecture (Pre-Sprint 1)
**Status**: Vault initialized, Order schema definition in progress
**Timeline**: 4 Sprints / 28 days to MVP

This is **Burger-AI** — an AI-powered ordering system for restaurants via voice and WhatsApp, integrated with POS systems. No code artifacts yet; focus is on architecture and system design.

---

## Vault System: Source of Truth

Before ANY work, read these files in order:

1. **`docs/vault/current.md`** — Where we are, blockers, next steps
2. **`docs/vault/roadmap.md`** — 4-sprint plan, phase structure
3. **`docs/vault/tech_stack.md`** — Technology choices, architecture layers
4. **`docs/vault/memory.md`** — Past decisions to not repeat

**These files ARE the project state.** Git commits should never contradict them. Update them after each milestone.

---

## Architecture Overview

```
Channels (WhatsApp, Twilio SIP, Web)
    ↓
API Gateway (Node.js/Python, WebSockets)
    ↓
[LLM: Claude 3.5 Sonnet] [Speech: Deepgram→ElevenLabs] [State Manager]
    ↓
PostgreSQL/Supabase Database
    ↓
[TPV Adapters] [Stripe Payments] [Monitoring (Datadog)]
```

**Critical Design Patterns**:
- **Input Normalization**: Both voice and WhatsApp converge into single `Order` object
- **Adapter Pattern for TPV**: Each POS system (Revo, Square, Toast) gets a `TPVAdapter` implementation that transforms `Order → TPV API format`
- **Full-Duplex Voice with VAD**: User can interrupt AI mid-response; Deepgram VAD triggers immediate output cancellation
- **Payment-First Rule**: Order only reaches kitchen AFTER Stripe webhook confirms payment

---

## Critical Blocker: Order Schema

The `Order` object is the contract between:
- AI (receiving voice/text input)
- Database (storing orders)
- TPV adapters (sending to POS systems)
- Payment processor (Stripe)
- Dashboard (displaying to staff)

**Status**: Definition in progress in `current.md` (section "PASO 1️⃣")

**Expected output**: `src/schemas/order.json` + TypeScript/JSON schema definitions

No database migrations, no API endpoints, no function calling should proceed until this schema is locked.

---

## Tech Stack (Finalized)

**Language Choice Pending**: Node.js vs Python (see `current.md` decisions section)

**Fixed Technologies**:
- **LLM**: Claude 3.5 Sonnet (Anthropic API)
- **Speech-to-Text**: Deepgram (real-time)
- **Text-to-Speech**: ElevenLabs Turbo
- **Database**: PostgreSQL via Supabase
- **Voice Channels**: Twilio SIP
- **Chat Channel**: Meta WhatsApp Business API
- **Payments**: Stripe (primary), Mercado Pago (fallback)
- **Monitoring**: Datadog or New Relic

**Not Yet Chosen**: Backend framework (Express vs FastAPI), frontend (Next.js vs React+Vite), TPV connectors (depends on pilot customer)

---

## Development Workflow

### Session Start
1. Read `docs/vault/current.md` (2 min)
2. Check task status and blockers
3. Read the specific task requirements
4. Proceed with work

### During Work
- Read existing code before modifying
- Use targeted searches (Glob/Grep) not full file reads
- Validate DB/API/services ready BEFORE coding against them
- Make small, frequent commits with clear messages
- Register architectural decisions in `memory.md` after implementing them

### Session End
- Update `current.md` with progress, blockers, next steps
- If architectural change: update `memory.md` with **decision + rationale**
- Verify `.env.example` includes any new config variables
- No secrets in commits

---

## Repository Structure (Expected)

```
burger-ai/
├── docs/vault/                 ← AUTHORITATIVE (read-heavy)
│   ├── current.md
│   ├── roadmap.md
│   ├── tech_stack.md
│   └── memory.md
│
├── src/
│   ├── backend/                ← Main API server (once built)
│   │   ├── routes/
│   │   ├── services/           ← LLM, Speech, Order orchestration
│   │   └── adapters/           ← TPV connectors (Revo, Square, etc.)
│   │
│   ├── frontend/               ← Dashboard (Next.js/React)
│   │
│   └── schemas/                ← JSON/TS definitions (Order, Payment, etc.)
│
├── tests/
│
├── docker-compose.yml          ← Local dev stack
│
├── .env.example               ← Never commit .env
│
└── CLAUDE.md ← This file
```

---

## Latency Budget (Critical Path)

Target: Full response in **< 1.5 seconds** (voice only)

- **Deepgram STT**: ~200ms
- **Claude LLM processing**: ~600ms (p95)
- **ElevenLabs TTS**: ~400ms
- **Overhead**: ~100ms
- **Total**: ~1.3s ✅

Monitor this relentlessly in Sprint 2. If exceeded, investigate in order: TTS latency → LLM latency → network overhead.

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| TPV has no API | HIGH | Plan B: Build KDS (Kitchen Display System) app + local DB agent |
| Voice latency > 1.5s | HIGH | Early testing Sprint 1, profile each layer |
| Stripe webhook failures | MEDIUM | Robust retry + idempotency keys |
| DB schema mismatch with Order | CRITICAL | Lock Order schema FIRST |

---

## Commands (Node.js + TypeScript)

**Development**:
```bash
# Install dependencies
npm install

# Start local dev server (watches for changes)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run single test file
npm test -- tests/unit/orders.test.ts

# Linting
npm run lint

# Format code
npm run format
```

**Database**:
```bash
# Run Supabase migrations
npm run db:migrate

# Reset database (dev only)
npm run db:reset

# Seed initial data
npm run db:seed
```

**Docker**:
```bash
# Start full local stack (API + Supabase + ngrok)
docker-compose up

# Stop everything
docker-compose down
```

**Debugging**:
```bash
# Run with debug logging
DEBUG=burger-ai:* npm run dev

# Debug WebSocket connections
DEBUG=burger-ai:voice:* npm run dev
```

For session workflow: See `.claudecode/instructions.md`

---

## Decision Framework

**When proposing architectural changes**:
1. Check `memory.md` for why current decision was made
2. If still valid → respect it
3. If obsolete → document new decision rationale + tradeoffs
4. Ask user BEFORE implementing if unclear

**When stuck**:
1. Check if it's documented in vault files
2. Use AskUserQuestion if ambiguous
3. Register decision/resolution in `memory.md`

---

## References

- **Sprint Structure**: `docs/vault/roadmap.md` (4 sprints, 28 days)
- **Tech Decisions**: `docs/vault/tech_stack.md` (why Deepgram, why Stripe, etc.)
- **Past Decisions**: `docs/vault/memory.md` (decisions taken + rationale)
- **Session Protocol**: `.claudecode/instructions.md` (how to work each session)
