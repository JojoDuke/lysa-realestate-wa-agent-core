import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { sharedStorage } from '../core/storage/memory.js';
import { buildAppContext } from '../core/config/loader.js';
import { createLysa } from './agents/lysa.js';
import { buildCapabilityRuntime } from './capabilities.js';

const appContext = buildAppContext();
const runtime = buildCapabilityRuntime(appContext.config);
const lysa = createLysa(appContext, runtime.agents, runtime.summaries);

export const mastra = new Mastra({
  agents: { lysa, ...runtime.agents },
  storage: sharedStorage,
  logger: new PinoLogger({ name: 'Lysa', level: 'info' }),
});

export { appContext };
