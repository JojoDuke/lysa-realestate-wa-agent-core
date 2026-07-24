/** Strip surrounding quotes Railway/.env copies sometimes include */
export function env(name: string, fallback = ''): string {
  const raw = process.env[name] ?? fallback;
  return raw.replace(/^['"]|['"]$/g, '');
}

export function envInt(name: string, fallback: number): number {
  const n = parseInt(env(name), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function envBool(name: string, fallback = false): boolean {
  const v = env(name).toLowerCase();
  if (!v) return fallback;
  return v === '1' || v === 'true' || v === 'yes';
}
