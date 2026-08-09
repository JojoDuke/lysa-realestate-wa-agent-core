import type { AppConfig, CapabilityId } from '../core/config/types.js';
import { conversationMemoryCapability } from './conversation-memory/index.js';
import { coreCapability } from './core/index.js';
import { knowledgeCapability } from './knowledge/index.js';
import { leadQualificationCapability } from './lead-qualification/index.js';
import { propertyDiscoveryCapability } from './property-discovery/index.js';
import { showingBookingCapability } from './showing-booking/index.js';
import type { CapabilityModule } from './types.js';

const ALL_MODULES: CapabilityModule[] = [
  coreCapability,
  knowledgeCapability,
  leadQualificationCapability,
  propertyDiscoveryCapability,
  showingBookingCapability,
  conversationMemoryCapability,
];

function isEnabled(config: AppConfig, id: string): boolean {
  if (id === 'core') return true;
  return config.capabilities.includes(id as CapabilityId);
}

/** Tools for enabled capabilities, or an explicit specialist subset (`only`). */
export function buildTools(config: AppConfig, only?: CapabilityId[]): Record<string, unknown> {
  const tools: Record<string, unknown> = {};
  for (const mod of ALL_MODULES) {
    const id = mod.id as CapabilityId;
    if (only) {
      if (!only.includes(id)) continue;
    } else if (!isEnabled(config, mod.id)) {
      continue;
    }
    Object.assign(tools, mod.getTools(config));
  }
  return tools;
}

export function buildPromptExtensions(config: AppConfig): string {
  return ALL_MODULES.filter((m) => isEnabled(config, m.id) && m.promptExtension)
    .map((m) => m.promptExtension!)
    .join('\n');
}
