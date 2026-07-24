import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { sharedStorage } from '../core/storage/memory.js';
import { buildAppContext } from '../core/config/loader.js';
import { createWhatsAppAgent } from '../agents/create-agent.js';

const appContext = buildAppContext();
const whatsappAgent = createWhatsAppAgent(appContext);

export const mastra = new Mastra({
  agents: { whatsappAgent },
  storage: sharedStorage,
  logger: new PinoLogger({ name: 'WA-Agent', level: 'info' }),
});

export { appContext };
