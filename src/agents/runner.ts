import type { Agent } from '@mastra/core/agent';
import { sharedStorage } from '../core/storage/memory.js';
import type { SupportedLang } from '../core/lib/language.js';
import { buildThreadId, buildResourceId } from '../core/config/loader.js';

const TIMEOUT_MS = 60_000;
const MAX_STEPS = 10;

export interface RunAgentParams {
  agent: Agent;
  incomingMessage: string;
  senderNumber: string;
  sessionContext: string;
}

export interface RunAgentResult {
  fullResponse: string;
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

export async function runAgent(params: RunAgentParams): Promise<RunAgentResult> {
  const { agent, incomingMessage, senderNumber, sessionContext } = params;
  const started = Date.now();
  const threadId = buildThreadId(senderNumber);
  const resourceId = buildResourceId(senderNumber);

  const userMessage = { role: 'user' as const, content: incomingMessage };
  const streamOptions = {
    memory: { thread: threadId, resource: resourceId },
    maxSteps: MAX_STEPS,
    context: [{ role: 'system' as const, content: sessionContext }],
  };

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Agent response timeout')), TIMEOUT_MS);
  });

  let fullResponse = '';
  let stepCount = 0;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = (await Promise.race([
        agent.stream([userMessage], streamOptions),
        timeout,
      ])) as AgentStreamResponse;

      fullResponse = await collectText(response);
      try {
        stepCount = (await response.getFullOutput()).steps?.length ?? 0;
      } catch {
        /* ignore */
      }
      break;
    } catch (err) {
      if (attempt === 0 && isDuplicateItemError(err)) {
        console.warn(`🛡️ Clearing corrupted thread ${threadId}`);
        await (sharedStorage as { deleteThread?: (a: { threadId: string }) => Promise<void> })?.deleteThread?.({
          threadId,
        });
        continue;
      }
      throw err;
    }
  }

  if (!fullResponse.trim()) {
    try {
      const retry = await Promise.race([
        agent.generate([userMessage], {
          ...streamOptions,
          maxSteps: 3,
          context: [
            {
              role: 'system' as const,
              content: `${sessionContext}\n\nCRITICAL: You must write a visible reply to the customer now.`,
            },
          ],
        }),
        timeout,
      ]);
      fullResponse = retry.text ?? '';
    } catch {
      /* ignore */
    }
  }

  return {
    fullResponse,
    durationMs: Date.now() - started,
    stepCount,
  };
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
