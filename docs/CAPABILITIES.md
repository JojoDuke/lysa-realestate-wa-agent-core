# Capabilities

Capabilities are optional modules assembled into the standalone agent from `config/app.json`.

## Included

- `core`: basic configured business information
- `knowledge`: searches knowledge entries from `config/app.json`

## Add a capability

Create `src/capabilities/example/index.ts`:

```ts
export const exampleCapability: CapabilityModule = {
  id: 'example',
  promptExtension: 'Instructions used only when this capability is enabled.',
  getTools: (config) => ({
    exampleTool: createTool({ /* ... */ }),
  }),
};
```

Register it in `src/capabilities/registry.ts`, add its ID to `CapabilityId`, and enable it in `config/app.json`.

## Booking

Booking is deliberately not part of the core because many customer agents will not need it.

When required, expose neutral tools:

- `listServices`
- `checkAvailability`
- `createBooking`
- `cancelBooking`

Implement a provider adapter behind those tools for Reservio, Reservanto, Cal.com, a customer API, or another system. Provider-specific details should not leak into the base agent runner or WhatsApp channel.
