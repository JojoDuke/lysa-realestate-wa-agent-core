# Architecture

This repository is a single-customer real-estate application template for agencies, brokerages, and property-management businesses, not a multi-tenant platform.

## Lifecycle

```text
Template repository (stable)
  → create repository / fork
  → customize that fork for one real-estate customer
  → deploy that customer agent independently
```

## Runtime

```text
WhatsApp or Mastra Studio
  → supervisor agent (whatsappAgent / Lysa)
  → specialist subagents (lead, knowledge, property, showing, memory)
  → capability tools (config demos or customer integrations)
  → optional Supabase / calendar / MLS
  → reply
```

Studio (`pnpm mastra:dev`) uses local LibSQL memory and does not require Supabase or Twilio.
WhatsApp (`pnpm dev`) is the production channel; add Supabase for durable users + Postgres memory.

## Boundaries

- `config/`: the customer-specific real-estate identity, knowledge, and agent instructions
- `channels/`: transport only; currently Twilio WhatsApp
- `agents/`: generic Mastra construction and reliable execution
- `capabilities/`: optional functionality such as property search, viewing scheduling, CRM handoff, lead capture, or tenant support
- `core/`: shared infrastructure that should rarely need customer-specific edits

## Isolation

Every real-estate customer fork should normally have its own:

- deployment
- Twilio account or subaccount and WhatsApp sender
- Supabase project
- provider credentials
- agent configuration and knowledge

No customer is represented inside the template itself.
