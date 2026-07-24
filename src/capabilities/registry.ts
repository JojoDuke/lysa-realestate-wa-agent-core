import type { AppConfig } from '../core/config/types.js';
import { coreCapability } from './core/index.js';
import { knowledgeCapability } from './knowledge/index.js';
import type { CapabilityModule } from './types.js';

const ALL_MODULES: CapabilityModule[] = [coreCapability, knowledgeCapability];

export function buildTools(config: AppConfig): Record<string, unknown> {
  const enabled = new Set(config.capabilities);
  const tools: Record<string, unknown> = {};

  for (const mod of ALL_MODULES) {
    if (enabled.has(mod.id as never) || mod.id === 'core') {
      Object.assign(tools, mod.getTools(config));
    }
  }

  return tools;
}

export function buildPromptExtensions(config: AppConfig): string {
  const enabled = new Set(config.capabilities);
  return ALL_MODULES.filter((m) => enabled.has(m.id as never) && m.promptExtension)
    .map((m) => m.promptExtension!)
    .join('\n');
}
