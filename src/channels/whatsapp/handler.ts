import MessagingResponse from 'twilio/lib/twiml/MessagingResponse';
import { appContext } from '../../mastra/index.js';
import { ensureUser } from '../../core/db/users.js';
import {
  detectLanguage,
  pickLang,
  emptyNudge,
} from '../../core/lib/language.js';
import {
  clearConversation,
  mapErrorToUserMessage,
  runLysa,
} from '../../mastra/runtime/runner.js';
import {
  sanitizeWhatsAppMessage,
  parseSplitMessages,
  extractImageUrl,
} from './formatter.js';
import { startTypingIndicator } from './typing.js';
import { sendWhatsAppMessage } from './twilio-client.js';
import { env } from '../../core/env.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BASE_URL = env('BASE_URL', 'http://localhost:3000');

const processing = new Set<string>();
const queues = new Map<string, Record<string, string>[]>();

function scheduleQueue(sender: string) {
  setImmediate(() => void drainQueue(sender));
}

async function drainQueue(sender: string) {
  if (processing.has(sender)) return;
  const q = queues.get(sender);
  if (!q?.length) return;
  const item = q.shift()!;
  if (!q.length) queues.delete(sender);
  await handleMessage(item);
  scheduleQueue(sender);
}

async function reply(
  body: Record<string, string>,
  res: import('express').Response | undefined,
  message: string,
) {
  if (res && !res.headersSent) {
    const twiml = new MessagingResponse();
    twiml.message(message);
    res.type('text/xml').send(twiml.toString());
  } else {
    await sendWhatsAppMessage(body.From, body.To, message);
  }
}

export async function handleWhatsAppWebhook(
  body: Record<string, string>,
  res?: import('express').Response,
): Promise<void> {
  const sender = body.From || '';
  if (processing.has(sender)) {
    const q = queues.get(sender) ?? [];
    q.push(body);
    queues.set(sender, q);
    if (res) res.type('text/xml').send(new MessagingResponse().toString());
    return;
  }
  await handleMessage(body, res);
}

async function handleMessage(body: Record<string, string>, res?: import('express').Response): Promise<void> {
  const incoming = body.Body || '';
  const sender = body.From || '';
  const messageSid = body.MessageSid || '';
  const twilioTo = body.To || '';
  processing.add(sender);

  try {
    const normalized = incoming.trim().toLowerCase();
    const userRow = await ensureUser(sender);
    const lang = pickLang(
      detectLanguage(incoming),
      appContext.config.locale.defaultLanguage,
    );

    console.log(`📱 [${sender}] → ${incoming}`);

    // Reset conversation
    if (
      appContext.config.features.conversationReset &&
      (normalized === '!clear' || normalized === '!reset')
    ) {
      await clearConversation(sender);
      processing.delete(sender);
      await reply(body, res, '✅ Conversation cleared. How can I help you?');
      scheduleQueue(sender);
      return;
    }

    if (!incoming.trim()) {
      processing.delete(sender);
      await reply(body, res, 'Hi! Send a message to get started.');
      scheduleQueue(sender);
      return;
    }

    const stopTyping = appContext.config.features.typingIndicator
      ? startTypingIndicator(messageSid)
      : () => {};

    if (res && !res.headersSent) {
      res.type('text/xml').send(new MessagingResponse().toString());
    }

    try {
      const agent = mastra.getAgent('whatsappAgent');
      if (!agent) throw new Error('whatsappAgent not registered');

      const sessionContext = [
        '[Session context]',
        `Business: ${appContext.config.brand.companyName}`,
        `User phone: ${canonical}`,
        userRow?.name ? `Saved name: ${userRow.name}` : 'No saved name yet.',
        userRow?.email ? `Saved email: ${userRow.email}` : 'No saved email yet.',
        `Language hint: ${lang}`,
      ].join('\n');

      console.log(`🔄 Calling ${appContext.config.brand.assistantName}...`);
      const { fullResponse } = await runAgent({
        agent,
        incomingMessage: incoming,
        senderNumber: sender,
        sessionContext,
      });

      console.log(`🤖 [${appContext.config.brand.assistantName}] → ${fullResponse.slice(0, 200)}${fullResponse.length > 200 ? '…' : ''}`);

      if (!fullResponse.trim()) {
        await sendWhatsAppMessage(sender, twilioTo, emptyNudge(lang));
        return;
      }

      const { intro, blocks } = parseSplitMessages(fullResponse);

      if (blocks.length > 0) {
        if (intro) {
          const s = sanitizeWhatsAppMessage(intro);
          if (s) await sendWhatsAppMessage(sender, twilioTo, s);
          await sleep(1000);
        }
        for (let i = 0; i < blocks.length; i++) {
          const { text, imageUrl } = extractImageUrl(blocks[i], BASE_URL);
          const s = sanitizeWhatsAppMessage(text);
          if (s) {
            await sendWhatsAppMessage(sender, twilioTo, s, imageUrl);
            if (i < blocks.length - 1) await sleep(i === blocks.length - 2 ? 4000 : 2500);
          }
        }
      } else {
        const { text, imageUrl } = extractImageUrl(fullResponse, BASE_URL);
        await sendWhatsAppMessage(sender, twilioTo, sanitizeWhatsAppMessage(text), imageUrl);
      }
    } catch (error) {
      console.error('❌ Agent error:', error);
      await sendWhatsAppMessage(sender, twilioTo, mapErrorToUserMessage(error, lang));
    } finally {
      stopTyping();
    }
  } catch (outer) {
    console.error('❌ Webhook crash:', outer);
    if (res && !res.headersSent) {
      res.type('text/xml').send(new MessagingResponse().toString());
    }
    await sendWhatsAppMessage(body.From, body.To, 'Sorry, something went wrong.');
  } finally {
    processing.delete(sender);
    scheduleQueue(sender);
  }
}
