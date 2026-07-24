# WhatsApp Agent Starter

A stable template repository for creating standalone customer-specific WhatsApp agents.

**Workflow:** create a new repository from this template, customize that new repository, and leave this template unchanged.

## Included

- Twilio WhatsApp webhook and outbound delivery
- Express server
- Mastra agent and persistent conversation memory
- Supabase user storage
- Typing indicator
- Per-user message queue
- WhatsApp-safe formatting and split messages
- Configurable knowledge capability
- Slots for booking, CRM, lead capture, support, and other capabilities

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Fill in `.env` (including `OPENROUTER_API_KEY`), run `supabase/migrations/001_initial.sql`, expose port 3000, and configure Twilio:

- Incoming webhook: `https://your-host/whatsapp`
- Status callback: `https://your-host/whatsapp/status`

## Customize a fork

Normal customer customization happens in:

- `config/app.json` — brand, locale, model, enabled capabilities, simple knowledge
- `config/system.md` — agent role, tone, rules, and workflow
- `src/capabilities/` — integrations and specialized behavior
- `.env` — OpenRouter, Twilio, Supabase, and provider credentials
- `config/app.json` → `model` — any OpenRouter model id (e.g. `openrouter/openai/gpt-4.1-mini`)

There is no tenant system. One fork represents one customer and one standalone agent.

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
