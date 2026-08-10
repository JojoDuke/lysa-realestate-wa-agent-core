import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../../core/config/types.js';
import {
  findSensitiveContent,
  listMemories,
  memoryStorageAvailable,
  saveMemory,
  searchMemories,
} from '../../../core/db/memories.js';
import { customerPhone, NO_CUSTOMER_RESULT } from '../context.js';

const STORAGE_UNAVAILABLE = {
  ok: false as const,
  reason: 'storage_unavailable',
  message: 'Long-term memory is not configured. Rely on the current conversation only.',
};

export function buildMemoryTools(config: AppConfig) {
  const maxItems = config.memory?.maxItems ?? 50;

  return {
    recallCustomerMemory: createTool({
      id: 'recall-customer-memory',
      description:
        'Retrieve what is already known about this customer from previous conversations: preferences, requirements, past interactions, and appointments',
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe('Optional topic filter. Omit to get the most recent memories.'),
      }),
      execute: async (inputData, context) => {
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;
        if (!memoryStorageAvailable()) return STORAGE_UNAVAILABLE;

        const memories = inputData.query
          ? await searchMemories(phone, inputData.query)
          : await listMemories(phone, Math.min(maxItems, 20));

        return {
          ok: true as const,
          count: memories.length,
          memories: memories.map((memory) => ({
            kind: memory.kind,
            content: memory.content,
            recordedAt: memory.created_at,
          })),
        };
      },
    }),

    saveCustomerMemory: createTool({
      id: 'save-customer-memory',
      description:
        'Store one durable fact about this customer that will still matter in a future conversation. Do not store small talk or anything sensitive.',
      inputSchema: z.object({
        kind: z
          .enum(['preference', 'requirement', 'interaction', 'appointment'])
          .describe('What kind of fact this is'),
        content: z.string().describe('One short sentence, written so a colleague can read it'),
      }),
      execute: async (inputData, context) => {
        const phone = customerPhone(context);
        if (!phone) return NO_CUSTOMER_RESULT;
        if (!memoryStorageAvailable()) return STORAGE_UNAVAILABLE;

        const sensitive = findSensitiveContent(inputData.content);
        if (sensitive) {
          return {
            ok: false as const,
            reason: 'sensitive_content',
            message: `Refused to store this because it looks like a ${sensitive}. Never store payment, credential, or identity-document details.`,
          };
        }

        const saved = await saveMemory(phone, inputData.kind, inputData.content);
        return { ok: saved !== null, memory: saved };
      },
    }),
  };
}
