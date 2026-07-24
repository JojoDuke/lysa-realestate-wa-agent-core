import twilio from 'twilio';
import { env } from '../../core/env.js';

let client: ReturnType<typeof twilio> | null = null;

export function getTwilioClient(): ReturnType<typeof twilio> {
  if (!client) {
    const sid = env('TWILIO_ACCOUNT_SID');
    const token = env('TWILIO_AUTH_TOKEN');
    if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set');
    client = twilio(sid, token);
  }
  return client;
}

export async function sendWhatsAppMessage(
  to: string,
  from: string,
  body: string,
  mediaUrl?: string,
): Promise<void> {
  await getTwilioClient().messages.create({
    to,
    from,
    body,
    mediaUrl: mediaUrl ? [mediaUrl] : undefined,
  });
}
