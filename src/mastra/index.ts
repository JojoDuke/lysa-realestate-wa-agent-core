import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { sharedStorage } from '../core/storage/memory.js';
import { buildAppContext } from '../core/config/loader.js';
import { buildCapabilityRuntime } from './capabilities.js';
import { createLysa } from './agents/lysa.js';

const appContext = buildAppContext();
const capabilities = buildCapabilityRuntime(appContext.config);
const lysa = createLysa(appContext, capabilities);

/**
 * Specialists are registered alongside Lysa so they are inspectable in Studio,
 * but customers always enter through `lysa`.
 */
export const mastra = new Mastra({
  agents: { lysa, ...capabilities.agents },
  workflows: capabilities.workflows,
  storage: sharedStorage,
  logger: new PinoLogger({ name: 'Lysa', level: 'info' }),
});

export { appContext, capabilities };
