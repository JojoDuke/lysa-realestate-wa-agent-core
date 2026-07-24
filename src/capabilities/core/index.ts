import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AppConfig } from '../../core/config/types.js';
import type { CapabilityModule } from '../types.js';

/** Always available — demonstrates the tool pattern */
export const coreCapability: CapabilityModule = {
  id: 'core',
  getTools: (config: AppConfig) => ({
    getBusinessInfo: createTool({
      id: 'get-business-info',
      description: 'Get configured information about this business and agent',
      inputSchema: z.object({}),
      execute: async () => ({
        companyName: config.brand.companyName,
        assistantName: config.brand.assistantName,
        timezone: config.locale.timezone,
        currency: config.locale.currency,
        defaultLanguage: config.locale.defaultLanguage,
        capabilities: config.capabilities,
      }),
    }),
  }),
};
