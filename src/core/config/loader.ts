import fs from 'fs';
import path from 'path';
import type { AppConfig, AppContext } from './types.js';

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export function loadAppConfig(): AppConfig {
  const configPath = path.join(process.cwd(), 'config', 'app.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`App config not found: ${configPath}`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AppConfig;
}

export function loadSystemPrompt(config: AppConfig): string {
  const promptPath = path.join(process.cwd(), 'config', 'system.md');
  if (!fs.existsSync(promptPath)) {
    throw new Error(`System prompt not found: ${promptPath}`);
  }

  return interpolate(fs.readFileSync(promptPath, 'utf-8'), {
    assistantName: config.brand.assistantName,
    companyName: config.brand.companyName,
    tone: config.brand.tone,
    defaultLanguage: config.locale.defaultLanguage,
    capabilitiesList: config.capabilities.map((capability) => `- ${capability}`).join('\n'),
  });
}

export function buildAppContext(): AppContext {
  const config = loadAppConfig();
  return { config, systemPrompt: loadSystemPrompt(config) };
}

export function buildThreadId(senderNumber: string): string {
  return `chat:${senderNumber.replace(/[^0-9]/g, '')}`;
}

export function buildResourceId(senderNumber: string): string {
  return senderNumber;
}
