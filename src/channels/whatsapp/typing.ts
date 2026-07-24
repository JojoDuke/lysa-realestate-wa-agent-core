import axios from 'axios';
import { env } from '../../core/env.js';

export async function sendTypingIndicator(messageSid: string): Promise<void> {
  const accountSid = env('TWILIO_ACCOUNT_SID');
  const authToken = env('TWILIO_AUTH_TOKEN');
  if (!accountSid || !authToken || !messageSid) return;

  try {
    await axios.post(
      'https://messaging.twilio.com/v2/Indicators/Typing.json',
      `messageId=${messageSid}&channel=whatsapp`,
      {
        auth: { username: accountSid, password: authToken },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
  } catch (error: unknown) {
    const err = error as { response?: { status: number; data: unknown }; message?: string };
    if (err.response) {
      console.warn('⚠️ Typing indicator failed:', err.response.status, JSON.stringify(err.response.data));
    }
  }
}

export function startTypingIndicator(messageSid: string): () => void {
  if (!messageSid) return () => {};
  void sendTypingIndicator(messageSid);
  const interval = setInterval(() => void sendTypingIndicator(messageSid), 4000);
  return () => clearInterval(interval);
}
