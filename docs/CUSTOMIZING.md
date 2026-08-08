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

Edit `config/system.md`:

- responsibilities
- enquiry-qualification flow for buyers, sellers, renters, landlords, tenants, and owners
- rules and boundaries, including no legal, financial, investment, or fair-housing advice
- escalation behavior for viewings, valuations, applications, availability, maintenance, and urgent hazards

## 3. Configure infrastructure

Copy `.env.example` to `.env` and provide:

- **OpenRouter API key** (yours during build; customer's at go-live — see [OPENROUTER.md](./OPENROUTER.md))
- Twilio account credentials and WhatsApp number
- Supabase URL and key
- Supabase database URL for durable Mastra memory

Run `supabase/migrations/001_initial.sql`.

## 4. Add required capabilities

Keep `core` enabled. Add or remove modules in `config/app.json`.

Examples:

```json
["core", "knowledge"]
```

```json
["core", "knowledge", "booking"]
```

Implement customer-specific external systems behind capability modules rather than in the WhatsApp handler. Common real-estate modules include:

- property search backed by the customer's MLS, listings feed, or property-management system
- viewing scheduling backed by the customer's calendar or booking provider
- lead capture and CRM handoff
- tenant maintenance or repair-request handoff

Only enable a capability after it has been implemented and registered. The starter does not include live listing, availability, viewing, or CRM integrations.

## 5. Test

- business, property, and process questions
- qualification of buyer, seller, renter, landlord, tenant, and owner enquiries
- refusal to invent availability, prices, property details, or appointment confirmations
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
