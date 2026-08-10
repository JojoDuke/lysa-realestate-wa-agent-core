# Lysa's capabilities

Lysa has five core capabilities. Each is a specialized agent she delegates to, enabled per customer in `config/app.json`.

## Lead Qualification

Qualifies buyers, sellers, renters, and landlords: contact details, requirements, budget, financing, and timeline.

- Tools: `getLeadProfile`, `saveLeadDetails`, `markLeadQualified`
- Workflow: `lead-qualification` — merges newly heard details into the stored lead and reports what is still missing
- Storage: `leads` table

The profile is loaded before anything is asked, so the customer is never asked twice.

## Knowledge

Answers questions about the business using only its approved knowledge base.

- Tools: `searchKnowledge`, `getBusinessInfo`
- Source: `config/knowledge.md` (`##` sections)

If nothing matches, it says so and recommends a human handoff instead of guessing.

## Property Discovery

Searches the catalogue, matches listings against requirements, and explains individual listings.

- Tools: `searchProperties`, `getPropertyDetails`
- Workflow: `property-search` — merges stored lead requirements with anything new the customer said, then searches once
- Source: `properties.listings` in `config/app.json`

The bundled provider reads listings from configuration. Replace `createPropertyProvider` in `src/core/properties/provider.ts` with an MLS, portal-feed, or PMS adapter; the `PropertyProvider` interface is all the agents depend on. With no listings configured, the tools report that the catalogue is unavailable rather than inventing properties.

## Viewing Booking

Handles viewing requests end to end.

- Tools: `checkViewingAvailability`, `requestViewing`, `listViewingRequests`, `cancelViewing`
- Workflow: `viewing-booking` — validates the property, records the request, and remembers it
- Storage: `viewing_requests` table
- Config: `scheduling.mode` (`request` or `disabled`), `availableWindows`, `viewingDurationMinutes`

There is no live calendar. A recorded request always carries a reference and is confirmed by a human. To integrate a real calendar, back `checkViewingAvailability` and `requestViewing` with the customer's provider.

## Memory

Recalls customer history across conversations and stores durable new facts.

- Tools: `recallCustomerMemory`, `saveCustomerMemory`
- Storage: `customer_memories` table

Payment, credential, and identity-document content is rejected before it can be written. Thread history is separate and always on, handled by Mastra memory.

## Enabling and disabling

```json
"capabilities": ["knowledge", "lead_qualification", "property_discovery", "viewing_booking", "memory"]
```

Removing an id removes the agent, its tools, its workflow, and its line in Lysa's routing table.

## Future capabilities

The same pattern extends to follow-up, document processing, transaction coordination, lead routing, agent briefing, listing management, valuation, CRM integrations, and additional channels such as voice, email, and SMS. None are implemented yet. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the steps to add one.
