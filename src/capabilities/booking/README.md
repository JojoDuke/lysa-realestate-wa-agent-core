# Optional booking capability

This directory is intentionally empty in the base template.

For a customer who needs booking:

1. Define a provider-neutral `BookingProvider` interface.
2. Implement the customer's provider adapter.
3. Wrap the interface with neutral Mastra tools.
4. Register the module in `src/capabilities/registry.ts`.
5. Enable `booking` in `config/app.json`.

Customers without booking retain a smaller agent and never load booking tools.
