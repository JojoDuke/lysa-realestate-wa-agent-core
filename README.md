# Lysa WA Agent Template

A stable template for standalone real-estate WhatsApp agents (agencies, brokerages, property managers).

**Workflow:** create a new repository from this template for each customer, customize that fork, leave this template unchanged.

## Lysa’s five specialists

Mastra Studio is the fastest way to develop. The template ships a **supervisor** (`whatsappAgent` / Lysa) plus five subagents:

| Agent | Role |
|---|---|
| `leadQualificationAgent` | Qualify enquiries, capture contact, Hot/Warm/Cold |
| `knowledgeAgent` | FAQs, process, fees, office info |
| `propertyDiscoveryAgent` | Search configured listings |
| `showingBookingAgent` | Check slots and book showings |
| `conversationMemoryAgent` | Recall / save customer preferences |

Demo listings and showing slots live in `config/app.json`. Swap those feeds for live MLS/calendar/CRM integrations per customer.

## Quick start (Mastra Studio — no Supabase required)

```bash
cp .env.example .env
# set OPENROUTER_API_KEY
pnpm install
pnpm mastra:dev
```

Open Studio at `http://localhost:3000`. Chat with Lysa or any specialist. Conversation memory uses local `mastra.db` until you set `SUPABASE_DATABASE_URL`.

## WhatsApp / production

```bash
pnpm dev
```

Then configure Twilio:

- Incoming webhook: `https://your-host/whatsapp`
- Status callback: `https://your-host/whatsapp/status`

Add Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_DATABASE_URL`) and run `supabase/migrations/001_initial.sql` when you need durable users + memory.

## Customize a customer fork

- `config/app.json` — brand, locale, model, capabilities, knowledge, listings, showing slots
- `config/system.md` — supervisor tone and rules
- `src/capabilities/` — replace demo tools with customer integrations
- `src/agents/specialists.ts` — specialist instructions
- `.env` — OpenRouter, Twilio, Supabase

See [Creating a real-estate customer fork](docs/CUSTOMIZING.md).

## Structure

```text
config/
  app.json                 Customer config + demo listings/slots
  system.md                Supervisor instructions
src/
  agents/                  Supervisor, specialists, runner
  capabilities/            Tools per specialist domain
  channels/whatsapp/       Twilio transport
  core/                    Config, optional Supabase, storage
  mastra/                  Mastra bootstrap (Studio entry)
supabase/migrations/       Schema for production users
```

## Memory

1. Conversation memory — Mastra threads (local `mastra.db` or Postgres via `SUPABASE_DATABASE_URL`)
2. Customer rows — Supabase `users` (optional; skipped when unset)
3. Preferences — in-memory store used by Conversation Memory (swap for Supabase later)
4. Business knowledge / listings — `config/app.json` until live feeds are wired

## LLM billing (OpenRouter)

Use **your** OpenRouter key while building. At go-live, swap in the **customer’s** key. See [OpenRouter setup & handoff](docs/OPENROUTER.md).

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Creating a customer fork](docs/CUSTOMIZING.md)
- [OpenRouter & handoff](docs/OPENROUTER.md)
- [Capabilities](docs/CAPABILITIES.md)
