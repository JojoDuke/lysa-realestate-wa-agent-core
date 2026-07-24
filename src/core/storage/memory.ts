import { LibSQLStore } from '@mastra/libsql';
import { PostgresStore } from '@mastra/pg';
import { env } from '../env.js';

const postgresUrl = env('SUPABASE_DATABASE_URL');

export const sharedStorage = postgresUrl
  ? new PostgresStore({
      id: 'wa-agent-store',
      connectionString: postgresUrl,
    })
  : (() => {
      console.warn(
        '⚠️  SUPABASE_DATABASE_URL not set — using local file:mastra.db (threads lost on redeploy).',
      );
      return new LibSQLStore({ id: 'wa-agent-store', url: 'file:mastra.db' });
    })();
