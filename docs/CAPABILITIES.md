# Real-estate capabilities (Lysa specialists)

Capabilities are tool modules bound to Lysa’s five specialist subagents. The WhatsApp supervisor delegates to them via Mastra’s `agents` map.

## Specialists

| Capability id | Subagent | Tools (template) |
|---|---|---|
| `lead_qualification` | `leadQualificationAgent` | `captureLead` |
| `knowledge` | `knowledgeAgent` | `searchKnowledge`, `getBusinessInfo` |
| `property_discovery` | `propertyDiscoveryAgent` | `searchListings` |
| `showing_booking` | `showingBookingAgent` | `checkShowingAvailability`, `requestShowing` |
| `conversation_memory` | `conversationMemoryAgent` | `recallPreferences`, `savePreferences` |

`core` is always available for business identity lookups.

## Demo vs customer

This template ships **offline-friendly demos**:

- Listings / slots from `config/app.json`
- Preferences in an in-memory map
- Lead capture that also updates Supabase `users` when credentials exist

For a real customer, replace the capability `execute` bodies with MLS, calendar, CRM, or PMS adapters. Keep tool ids stable so specialist prompts stay valid.

## Add a capability

1. Create `src/capabilities/example/index.ts` exporting a `CapabilityModule`
2. Register it in `src/capabilities/registry.ts`
3. Add a specialist (or extend an existing one) in `src/agents/specialists.ts`
4. Enable the id in `config/app.json` → `capabilities`
5. Re-test in `pnpm mastra:dev`
