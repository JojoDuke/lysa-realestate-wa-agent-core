# OpenRouter

This template uses [OpenRouter](https://openrouter.ai) as the default LLM gateway. Mastra reads `OPENROUTER_API_KEY` and routes requests based on the model string in `config/app.json`.

## Setup

1. Create an account at https://openrouter.ai
2. Add credits / billing
3. Create an API key
4. Add to `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

5. Pick a model in `config/app.json`:

```json
"model": "openrouter/openai/gpt-4.1-mini"
```

Browse models: https://openrouter.ai/models

Examples:

| Model id | Good for |
|---|---|
| `openrouter/openai/gpt-4.1-mini` | Default — fast, cheap, capable |
| `openrouter/openai/gpt-4.1` | Higher quality, higher cost |
| `openrouter/anthropic/claude-haiku-4.5` | Alternative provider |
| `openrouter/google/gemini-2.5-flash` | Fast multilingual |

Use the `openrouter/` prefix — Mastra's model router handles the rest.

## Build vs handoff

| Phase | Who pays | API key |
|---|---|---|
| **You build the fork** | You | Your `OPENROUTER_API_KEY` in `.env` |
| **Customer goes live** | Customer | Their key in production `.env` |

At handoff:

1. Customer creates an OpenRouter account and adds billing
2. Customer generates their own API key
3. Replace `OPENROUTER_API_KEY` in production (Railway, Fly.io, etc.)
4. Remove or revoke your key from their deployment
5. Customer pays OpenRouter directly for ongoing usage

You are not on the hook for their production token usage once the key is swapped.

## Cost drivers

OpenRouter bills per token (input + output). Usage grows with:

- number of WhatsApp messages
- conversation length (Mastra memory sends history)
- tool calls (each step may add model rounds)
- model choice (mini vs full models)

Monitor usage in the OpenRouter dashboard.

## Direct OpenAI instead (optional)

If a customer prefers OpenAI directly, change `config/app.json`:

```json
"model": "openai/gpt-4.1-mini"
```

And set `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY`. Only do this per customer fork — keep the template on OpenRouter unless you standardize otherwise.
