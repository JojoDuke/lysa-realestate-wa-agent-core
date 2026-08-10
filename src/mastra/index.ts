import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { sharedStorage } from '../core/storage/memory.js';
import { buildAppContext } from '../core/config/loader.js';
import { createLysa } from './agents/lysa.js';

const appContext = buildAppContext();
const lysa = createLysa(appContext);

export const mastra = new Mastra({
  agents: { lysa },
  storage: sharedStorage,
  logger: new PinoLogger({ name: 'Lysa', level: 'info' }),
});

export { appContext };
