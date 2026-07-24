import type { AppConfig } from '../core/config/types.js';

export type { CapabilityId } from '../core/config/types.js';

export interface CapabilityModule {
  id: string;
  /** Extra system prompt section appended when enabled */
  promptExtension?: string;
  /** Mastra tools to register */
  getTools: (config: AppConfig) => Record<string, unknown>;
}
