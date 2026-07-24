# Creating a customer fork

## 1. Create a repository from the template

Use GitHub's **Use this template** action or fork/copy the repository. All following changes happen in the new customer repository.

## 2. Configure the agent

Edit `config/app.json`:

- company and assistant names
- tone
- languages, timezone, and currency
- model
- enabled capabilities
- initial FAQ knowledge

Edit `config/system.md`:

- responsibilities
- conversation flow
- rules and boundaries
- escalation behavior

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

Implement customer-specific external systems behind capability modules rather than in the WhatsApp handler.

## 5. Test

- business questions
- `!clear`
- message queue behavior
- durable memory after restart
- all external tool calls

## 6. Deploy

Deploy the fork as an independent service and point that customer's Twilio webhook to it.

## 7. Hand off billing

Before the customer uses the agent in production:

1. Customer creates OpenRouter, Twilio, and Supabase accounts (if they don't already have them)
2. Replace `OPENROUTER_API_KEY` in production with the customer's key
3. Point Twilio and Supabase to the customer's projects
4. Revoke your keys from their production environment

See [OPENROUTER.md](./OPENROUTER.md) for model selection and usage notes.
