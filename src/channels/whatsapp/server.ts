import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { env, envInt } from '../../core/env.js';
import { appContext } from '../../mastra/index.js';
import { handleWhatsAppWebhook } from './handler.js';

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

app.post('/whatsapp', (req, res) => {
  void handleWhatsAppWebhook(req.body, res);
});

app.post('/whatsapp/status', (_req, res) => {
  res.sendStatus(200);
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: appContext.config.name,
    assistant: appContext.config.brand.assistantName,
    capabilities: appContext.config.capabilities,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'wa-agent-starter',
    company: appContext.config.brand.companyName,
    endpoints: { webhook: '/whatsapp', health: '/health' },
  });
});

const port = envInt('PORT', 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 WA Agent Starter listening on port ${port}`);
  console.log(`📲 Webhook: http://localhost:${port}/whatsapp`);
  console.log(`🏢 Company: ${appContext.config.brand.companyName}`);
  console.log(`🤖 Assistant: ${appContext.config.brand.assistantName}`);
  console.log(`🔧 Capabilities: ${appContext.config.capabilities.join(', ')}`);
  console.log(`🔑 OpenRouter: ${env('OPENROUTER_API_KEY') ? '✅' : '❌ NOT SET'}`);
  console.log(`🧠 Model: ${appContext.config.model}`);
  console.log(`🔑 Twilio: ${env('TWILIO_ACCOUNT_SID') ? '✅' : '❌ NOT SET'}`);
  console.log(`🔑 Supabase: ${env('SUPABASE_URL') ? '✅' : '❌ NOT SET'}`);
  console.log(`🔑 Mastra memory: ${env('SUPABASE_DATABASE_URL') ? 'Postgres ✅' : 'local file ⚠️'}`);
});
