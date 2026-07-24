/** Canonical phone key for the users table */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let s = raw.replace(/^whatsapp:/i, '').trim();
  s = s.replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  return s;
}
