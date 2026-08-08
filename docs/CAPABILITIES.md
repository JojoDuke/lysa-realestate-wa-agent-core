# Real-estate capabilities

Capabilities are optional modules assembled into a standalone real-estate agent from `config/app.json`.

## Included

- `core`: basic configured agency, brokerage, or property-management information
- `knowledge`: searches configured property, service, and process knowledge from `config/app.json`

## Common extensions

Add only the modules a customer can support operationally:

- **Property search:** query the customer's MLS, listing feed, or property-management system. Return only current records and clearly identify when data is unavailable.
- **Viewing scheduling:** check availability and request or create property-viewing appointments.
- **Lead capture / CRM:** create or update a lead after collecting consent and the minimum useful contact and enquiry details.
- **Tenant support:** route maintenance requests and provide the customer's emergency-maintenance procedure.

These modules are not bundled as live integrations because each customer uses different listing, scheduling, CRM, and property-management systems.

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

## Viewing scheduling

Viewing scheduling is deliberately not part of the core because it requires a customer-specific calendar, booking provider, or CRM integration.

When required, expose neutral tools:

- `checkViewingAvailability`
- `requestViewing`
- `cancelViewing`

Implement a provider adapter behind those tools for the customer's calendar, CRM, property-management system, or another provider. Provider-specific details should not leak into the base agent runner or WhatsApp channel.
