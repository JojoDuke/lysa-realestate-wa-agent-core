import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { sharedStorage } from '../core/storage/memory.js';
import { buildAppContext } from '../core/config/loader.js';
import { createLysaAgents } from '../agents/create-agent.js';

const appContext = buildAppContext();
const agents = createLysaAgents(appContext);

export const mastra = new Mastra({
  agents,
  storage: sharedStorage,
  logger: new PinoLogger({ name: 'Lysa', level: 'info' }),
});

export { appContext };
