# Lysa WA Agent Template

A stable template repository for creating standalone, real-estate WhatsApp agents. It is designed for agencies, brokerages, and property-management businesses.

**Workflow:** create a new repository from this template for each real-estate customer, customize that repository, and leave this template unchanged.

## Included

- Twilio WhatsApp webhook and outbound delivery
- Express server
- Mastra agent and persistent conversation memory
- Supabase user storage
- Typing indicator
- Per-user message queue
- WhatsApp-safe formatting and split messages
- Configurable property, service, and process knowledge
- Slots for property search, viewing scheduling, CRM, lead capture, tenant support, and other capabilities

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Fill in `.env` (including `OPENROUTER_API_KEY`), run `supabase/migrations/001_initial.sql`, expose port 3000, and configure Twilio:

- Incoming webhook: `https://your-host/whatsapp`
- Status callback: `https://your-host/whatsapp/status`

## Customize a customer fork

Normal customer customization happens in:

- `config/app.json` — business identity, locale, model, enabled capabilities, and property/process knowledge
- `config/system.md` — real-estate role, tone, qualification flow, rules, and escalation behavior
- `src/capabilities/` — property-data, viewing, CRM, lead-capture, and tenant-support integrations
- `.env` — OpenRouter, Twilio, Supabase, and provider credentials
- `config/app.json` → `model` — any OpenRouter model id (e.g. `openrouter/openai/gpt-4.1-mini`)

There is no tenant system. One fork represents one real-estate customer and one standalone agent. See [Creating a real-estate customer fork](docs/CUSTOMIZING.md) for the complete checklist.

## Structure

```text
config/
  app.json                 Customer and feature configuration
  system.md                Agent instructions
src/
  agents/                  Agent factory and runner
  capabilities/            Optional tools and integrations
  channels/whatsapp/       Twilio transport
  core/                    Database, config, memory, utilities
  mastra/                  Mastra bootstrap
supabase/migrations/       Reproducible database schema
```

## Memory

The starter separates:

1. Conversation memory — Mastra thread history keyed by the WhatsApp number
2. Customer data — Supabase `users`
3. Business knowledge — configuration now; Supabase/vector search can replace it later

Set `SUPABASE_DATABASE_URL` in production. Without it, Mastra uses local `mastra.db`, which is not durable across redeploys.

## LLM billing (OpenRouter)

Use **your** OpenRouter key while building a customer fork. At go-live, swap in **the customer's** key in production — they pay for usage from then on. See [OpenRouter setup & handoff](docs/OPENROUTER.md).

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Creating a customer fork](docs/CUSTOMIZING.md)
- [OpenRouter & handoff](docs/OPENROUTER.md)
- [Capabilities](docs/CAPABILITIES.md)
