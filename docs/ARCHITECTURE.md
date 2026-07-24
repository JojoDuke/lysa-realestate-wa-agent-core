# Architecture

This repository is a single-customer application template, not a multi-tenant platform.

## Lifecycle

```text
Template repository (stable)
  → create repository / fork
  → customize that fork for one customer
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

- `config/`: the customer-specific identity and agent instructions
- `channels/`: transport only; currently Twilio WhatsApp
- `agents/`: generic Mastra construction and reliable execution
- `capabilities/`: optional business functionality such as knowledge, booking, CRM, or support
- `core/`: shared infrastructure that should rarely need customer-specific edits

## Isolation

Every customer fork should normally have its own:

- deployment
- Twilio account or subaccount and WhatsApp sender
- Supabase project
- provider credentials
- agent configuration and knowledge

No customer is represented inside the template itself.
