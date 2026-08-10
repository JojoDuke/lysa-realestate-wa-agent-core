# Lysa WA Agent Template

A stable template repository for creating standalone, real-estate WhatsApp agents. It is designed for agencies, brokerages, and property-management businesses.

**Workflow:** create a new repository from this template for each real-estate customer, customize that repository, and leave this template unchanged.

## Lysa

Lysa is the assistant the customer talks to. She works out what they need and delegates to a specialist:

```text
LYSA (orchestrator)
├── Lead Qualification   qualify buyers and sellers, capture requirements
├── Knowledge            answer from the approved knowledge base
├── Property Discovery   search and match listings
├── Viewing Booking      record and manage viewing requests
└── Memory               recall and store customer history
```

Capabilities are switched on per customer in `config/app.json`. See [Capabilities](docs/CAPABILITIES.md).

## Included

- Twilio WhatsApp webhook and outbound delivery
- Express server
- Orchestrator agent with five capability specialists, tools, and workflows
- Persistent conversation memory plus long-term customer memory
- Supabase storage for users, leads, memories, and viewing requests
- Typing indicator
- Per-user message queue
- WhatsApp-safe formatting and split messages
- Provider-neutral property catalogue and scheduling

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Fill in `.env` (including `OPENROUTER_API_KEY`), run the migrations in `supabase/migrations/`, expose port 3000, and configure Twilio:

- Incoming webhook: `https://your-host/whatsapp`
- Status callback: `https://your-host/whatsapp/status`

## Customize a customer fork

Normal customer customization happens in:

- `config/app.json` — business identity, locale, model, enabled capabilities, listings, and scheduling policy
- `config/knowledge.md` — approved business knowledge the knowledge agent searches
- `config/system.md` — Lysa's role, tone, qualification flow, rules, and escalation behavior
- `src/mastra/tools/` — the concrete actions each capability can take
- `src/core/properties/provider.ts` — swap the config catalogue for an MLS, portal feed, or PMS
- `.env` — OpenRouter, Twilio, Supabase, and provider credentials
- `config/app.json` → `model` — any OpenRouter model id (e.g. `openrouter/openai/gpt-4.1-mini`)

There is no tenant system. One fork represents one real-estate customer and one standalone agent. See [Creating a real-estate customer fork](docs/CUSTOMIZING.md) for the complete checklist.

## Structure

```text
config/
  app.json                 Customer, capability, listing, and scheduling configuration
  system.md                Lysa's persona and boundaries
src/
  mastra/
    agents/                Lysa and the five capability specialists
    tools/                 Concrete actions, grouped by capability
    workflows/             Deterministic multi-step processes
    runtime/               One conversational turn: streaming, retries, timeouts
    capabilities.ts        Assembles the capabilities enabled in app.json
    index.ts               Mastra registration
  channels/whatsapp/       Twilio transport only
  core/                    Config, database, property provider, utilities
supabase/migrations/       Reproducible database schema
```

## Memory

The starter separates:

1. Conversation memory — Mastra thread history keyed by the WhatsApp number
2. Long-term customer memory — Supabase `customer_memories`, managed by the Memory capability
3. Customer and lead data — Supabase `users`, `leads`, and `viewing_requests`
4. Business knowledge — `config/knowledge.md` now; Supabase/vector search can replace it later

Set `SUPABASE_DATABASE_URL` in production. Without it, Mastra uses local `mastra.db`, which is not durable across redeploys.

## LLM billing (OpenRouter)

Use **your** OpenRouter key while building a customer fork. At go-live, swap in **the customer's** key in production — they pay for usage from then on. See [OpenRouter setup & handoff](docs/OPENROUTER.md).

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Creating a customer fork](docs/CUSTOMIZING.md)
- [OpenRouter & handoff](docs/OPENROUTER.md)
- [Capabilities](docs/CAPABILITIES.md)
