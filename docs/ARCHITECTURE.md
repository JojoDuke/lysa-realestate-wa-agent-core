# Architecture

This repository is a single-customer real-estate application template for agencies, brokerages, and property-management businesses, not a multi-tenant platform.

## Lifecycle

```text
Template repository (stable)
  → create repository / fork
  → customize that fork for one real-estate customer
  → deploy that customer agent independently
```

## Lysa

Lysa is the primary conversational agent. The customer only ever talks to Lysa; she decides whether she can answer directly or needs a capability specialist.

```text
LYSA (orchestrator)
├── Lead Qualification Agent
├── Knowledge Agent
├── Property Discovery Agent
├── Viewing Booking Agent
└── Memory Agent
```

Each specialist is a Mastra agent registered as a sub-agent of Lysa, so Mastra exposes it to her as an `agent-<name>` tool. Specialists answer Lysa, never the customer, and Lysa rewrites their output in her own voice.

## Runtime

```text
WhatsApp
  → Twilio POST /whatsapp
  → Express handler (transport only)
  → runLysa()
  → Lysa
  → specialist agent → tools / workflow
  → Supabase and external providers
  → Twilio response
```

## Division of responsibility

- **Agents reason.** They interpret intent and decide what to do.
- **Tools act.** One tool performs one concrete action: search, save, record, cancel.
- **Workflows coordinate.** They run deterministic multi-step processes where the order matters and should not be left to a model.

## Boundaries

- `config/`: the customer-specific identity, knowledge, listings, scheduling policy, and Lysa's persona
- `channels/`: transport only; currently Twilio WhatsApp. No business logic.
- `mastra/agents/`: Lysa and the capability specialists
- `mastra/tools/`: concrete actions, grouped by capability
- `mastra/workflows/`: deterministic multi-step processes
- `mastra/runtime/`: one conversational turn — streaming, memory, retries, timeouts
- `mastra/capabilities.ts`: assembles the capabilities enabled in `config/app.json`
- `core/`: shared infrastructure — config, database, property provider, phone and language helpers

## Adding a capability

1. Add tools under `src/mastra/tools/<capability>/`.
2. Add an agent under `src/mastra/agents/`, with a `description` that says exactly when to use it — that text is how Lysa routes.
3. Add a workflow when the process has a fixed order of steps.
4. Register the capability in `src/mastra/capabilities.ts` and add its id to `CapabilityId`.
5. Enable it in `config/app.json`.

Lysa's routing table is generated from the enabled capabilities, so a disabled capability never appears in her prompt.

## Isolation

Every real-estate customer fork should normally have its own:

- deployment
- Twilio account or subaccount and WhatsApp sender
- Supabase project
- provider credentials
- agent configuration and knowledge

No customer is represented inside the template itself.
