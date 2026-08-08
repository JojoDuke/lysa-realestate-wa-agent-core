# Optional viewing-scheduling capability

This directory is intentionally empty in the base template.

For a real-estate customer that needs viewing scheduling:

1. Define a provider-neutral `ViewingProvider` interface.
2. Implement the customer's provider adapter.
3. Wrap the interface with neutral Mastra tools.
4. Register the module in `src/capabilities/registry.ts`.
5. Enable `booking` in `config/app.json`.

Use tools such as `checkViewingAvailability`, `requestViewing`, and `cancelViewing`. Do not expose provider-specific details to the agent.

Customers without viewing scheduling retain a smaller agent and never load viewing tools.
