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
WhatsApp
  → Twilio POST /whatsapp
  → Express handler
  → Mastra agent
  → enabled capability tools
  → Supabase and external APIs
  → Twilio response
```

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
