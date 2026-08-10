import { RequestContext } from '@mastra/core/request-context';
import { sharedStorage } from '../../core/storage/memory.js';
import { buildResourceId, buildThreadId } from '../../core/config/loader.js';
import { normalizePhone } from '../../core/lib/phone.js';
import type { CustomerIdentity } from '../../core/config/types.js';
import type { SupportedLang } from '../../core/lib/language.js';
import { appContext, mastra } from '../index.js';

const TIMEOUT_MS = 60_000;
const MAX_STEPS = 10;

export interface LysaTurn {
  message: string;
  customer: CustomerIdentity;
  language: SupportedLang;
}

export interface LysaResult {
  text: string;
  durationMs: number;
  stepCount: number;
}

type AgentStreamResponse = {
  textStream: ReadableStream<string>;
  text: Promise<string>;
  getFullOutput: () => Promise<{ text: string; steps: unknown[] }>;
};

function isDuplicateItemError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /Duplicate item found with id/i.test(msg);
}

async function readStream(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += value;
    }
  } finally {
    reader.releaseLock();
  }
  return text;
}

async function collectText(response: AgentStreamResponse): Promise<string> {
  let text = '';
  try {
    text = await readStream(response.textStream);
  } catch {
    /* ignore */
  }
  if (!text.trim()) {
    try {
      text = (await response.text) ?? '';
    } catch {
      /* ignore */
    }
  }
  if (!text.trim()) {
    try {
      text = (await response.getFullOutput()).text ?? '';
    } catch {
      /* ignore */
    }
  }
  return text;
}

/** Facts about this turn that every specialist and tool can read. */
function buildRequestContext(customer: CustomerIdentity, language: SupportedLang): RequestContext {
  const requestContext = new RequestContext();
  requestContext.set('customerPhone', normalizePhone(customer.phone));
  if (customer.name) requestContext.set('customerName', customer.name);
  if (customer.email) requestContext.set('customerEmail', customer.email);
  requestContext.set('language', language);
  return requestContext;
}

function buildSessionContext(customer: CustomerIdentity, language: SupportedLang): string {
  const { config } = appContext;
  return [
    '[Session context]',
    `Business: ${config.brand.companyName}`,
    `User phone: ${normalizePhone(customer.phone)}`,
    customer.name ? `Saved name: ${customer.name}` : 'No saved name yet.',
    customer.email ? `Saved email: ${customer.email}` : 'No saved email yet.',
    `Language hint: ${language}`,
  ].join('\n');
}

/**
 * Runs one conversational turn through Lysa. Channels call this instead of touching
 * agents directly, so streaming, memory, retries, and timeouts stay in one place.
 */
export async function runLysa(turn: LysaTurn): Promise<LysaResult> {
  const started = Date.now();
  const agent = mastra.getAgent('lysa');
  if (!agent) throw new Error('lysa agent is not registered');

  const threadId = buildThreadId(turn.customer.phone);
  const resourceId = buildResourceId(turn.customer.phone);

  const userMessage = { role: 'user' as const, content: turn.message };
  const streamOptions = {
    memory: { thread: threadId, resource: resourceId },
    maxSteps: MAX_STEPS,
    requestContext: buildRequestContext(turn.customer, turn.language),
    context: [
      { role: 'system' as const, content: buildSessionContext(turn.customer, turn.language) },
    ],
  };

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Agent response timeout')), TIMEOUT_MS);
  });

  let text = '';
  let stepCount = 0;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = (await Promise.race([
        agent.stream([userMessage], streamOptions),
        timeout,
      ])) as AgentStreamResponse;

      text = await collectText(response);
      try {
        stepCount = (await response.getFullOutput()).steps?.length ?? 0;
      } catch {
        /* ignore */
      }
      break;
    } catch (err) {
      if (attempt === 0 && isDuplicateItemError(err)) {
        console.warn(`🛡️ Clearing corrupted thread ${threadId}`);
        await clearConversation(turn.customer.phone);
        continue;
      }
      throw err;
    }
  }

  if (!text.trim()) {
    try {
      const retry = await Promise.race([
        agent.generate([userMessage], {
          ...streamOptions,
          maxSteps: 3,
          context: [
            {
              role: 'system' as const,
              content: `${buildSessionContext(turn.customer, turn.language)}\n\nCRITICAL: You must write a visible reply to the customer now.`,
            },
          ],
        }),
        timeout,
      ]);
      text = retry.text ?? '';
    } catch {
      /* ignore */
    }
  }

  return { text, durationMs: Date.now() - started, stepCount };
}

export async function clearConversation(phone: string): Promise<void> {
  const threadId = buildThreadId(phone);
  await (
    sharedStorage as { deleteThread?: (a: { threadId: string }) => Promise<void> }
  )?.deleteThread?.({ threadId });
}

export function mapErrorToUserMessage(error: unknown, lang: SupportedLang): string {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  if (/timeout/i.test(msg)) {
    return lang === 'cs'
      ? 'Omlouvám se, odpověď trvala příliš dlouho. Zkuste to prosím znovu.'
      : 'Sorry, that took too long. Please try again.';
  }
  return lang === 'cs'
    ? 'Omlouvám se, něco se pokazilo. Zkuste to prosím znovu.'
    : 'Sorry, something went wrong. Please try again.';
}
