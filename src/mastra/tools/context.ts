import type { RequestContext } from '@mastra/core/request-context';

/** Values the channel puts on the request context for every turn. */
export interface LysaRequestValues {
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  language?: string;
}

export const CUSTOMER_PHONE_KEY = 'customerPhone';

type ToolContext = { requestContext?: RequestContext<any> };

function readString(context: ToolContext, key: string): string | null {
  const value = context?.requestContext?.get(key) as unknown;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function customerPhone(context: ToolContext): string | null {
  return readString(context, CUSTOMER_PHONE_KEY);
}

export function customerName(context: ToolContext): string | null {
  return readString(context, 'customerName');
}

/** Uniform shape so agents can report a blocked action instead of inventing an outcome. */
export const NO_CUSTOMER_RESULT = {
  ok: false as const,
  reason: 'no_customer_context',
  message:
    'No customer is attached to this conversation, so this action cannot run. Ask the customer to send a new message.',
};
