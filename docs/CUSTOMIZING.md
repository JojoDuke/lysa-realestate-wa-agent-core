# Creating a real-estate customer fork

## 1. Create a repository from the template

Use GitHub's **Use this template** action or fork/copy the Lysa WA Agent Template. All following changes happen in the new customer repository.

## 2. Configure the agent

Edit `config/app.json`:

- agency, brokerage, or property-management company name
- assistant name and tone
- languages, timezone, and currency
- model
- enabled capabilities
- initial knowledge: service areas, property types, office hours, fees, viewing process, valuation process, and maintenance procedure

Edit `config/system.md`, which is Lysa's persona and boundaries:

- responsibilities and tone
- enquiry-qualification flow for buyers, sellers, renters, landlords, tenants, and owners
- rules and boundaries, including no legal, financial, investment, or fair-housing advice
- escalation behavior for viewings, valuations, applications, availability, maintenance, and urgent hazards

Delegation rules are generated from the enabled capabilities and appended automatically, so `system.md` should not mention tools or specialists.

## 3. Configure infrastructure

Copy `.env.example` to `.env` and provide:

- **OpenRouter API key** (yours during build; customer's at go-live — see [OPENROUTER.md](./OPENROUTER.md))
- Twilio account credentials and WhatsApp number
- Supabase URL and key
- Supabase database URL for durable Mastra memory

Run `supabase/migrations/001_initial.sql`, then `supabase/migrations/002_capabilities.sql`.

## 4. Choose capabilities

Enable or remove Lysa's capabilities in `config/app.json`:

```json
"capabilities": ["knowledge", "lead_qualification", "property_discovery", "viewing_booking", "memory"]
```

Removing an id removes that specialist, its tools, and its workflow. See [CAPABILITIES.md](./CAPABILITIES.md).

Then connect the customer's real systems:

- **Property discovery:** add listings to `properties.listings`, or replace the provider in `src/core/properties/provider.ts` with an MLS, portal-feed, or PMS adapter.
- **Viewing booking:** set `scheduling.mode` and `availableWindows`, or back the scheduling tools with the customer's calendar or booking provider.
- **Lead qualification:** forward qualified leads to the customer's CRM from the lead tools.

Implement external systems behind tools and providers, never in the WhatsApp handler. Without a provider, the tools report the capability as unavailable instead of inventing listings, availability, or confirmations.

## 5. Test

- business, property, and process questions
- qualification of buyer, seller, renter, landlord, tenant, and owner enquiries
- property search, viewing requests, and recall of a returning customer
- refusal to invent availability, prices, property details, or appointment confirmations
- Lysa never naming an internal agent, tool, or workflow
- human handoff and emergency-maintenance directions
- `!clear`
- message queue behavior
- durable memory after restart
- all external tool calls

## 6. Deploy

Deploy the fork as an independent service and point that customer's Twilio webhook to it. Each customer needs their own deployment, WhatsApp sender, Supabase project, and provider credentials.

## 7. Hand off billing

Before the customer uses the agent in production:

1. Customer creates OpenRouter, Twilio, and Supabase accounts (if they don't already have them)
2. Replace `OPENROUTER_API_KEY` in production with the customer's key
3. Point Twilio and Supabase to the customer's projects
4. Revoke your keys from their production environment

See [OPENROUTER.md](./OPENROUTER.md) for model selection and usage notes.
