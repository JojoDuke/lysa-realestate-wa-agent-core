const WHATSAPP_LIMIT = 1600;

export function sanitizeWhatsAppMessage(message: string): string {
  if (!message?.trim()) {
    return 'Sorry, I encountered an issue. Please try again.';
  }

  let sanitized = message
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\*\*\*/g, '*')
    .replace(/\*\*/g, '*')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[\-\+]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\[IMAGE:.*?\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (!sanitized) {
    return 'Sorry, I encountered an issue with the response format. Please try again.';
  }

  if (sanitized.length > WHATSAPP_LIMIT) {
    sanitized = sanitized.substring(0, WHATSAPP_LIMIT - 100) + '\n\n... (message truncated)';
  }

  return sanitized;
}

export function parseSplitMessages(fullResponse: string): {
  intro: string | null;
  blocks: string[];
} {
  const regex = /\[SPLIT_MESSAGE\]([\s\S]*?)\[\/SPLIT_MESSAGE\]/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(fullResponse)) !== null) {
    blocks.push(match[1].trim());
  }

  if (blocks.length === 0) return { intro: null, blocks: [] };

  const firstIdx = fullResponse.indexOf('[SPLIT_MESSAGE]');
  const intro = firstIdx > 0 ? fullResponse.substring(0, firstIdx).trim() : null;
  return { intro, blocks };
}

export function extractImageUrl(text: string, baseUrl: string): { text: string; imageUrl?: string } {
  const imageMatch = text.match(/\[IMAGE:\s*(.*?)\]/);
  if (!imageMatch?.[1]) return { text };
  let imageUrl = imageMatch[1].trim();
  if (imageUrl.startsWith('/')) {
    imageUrl = `${baseUrl.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
  }
  return { text: text.replace(/\[IMAGE:.*?\]/g, '').trim(), imageUrl };
}
