import { withSupabase } from './supabase.js';
import { normalizePhone } from '../lib/phone.js';

export interface UserRow {
  phone_number: string;
  name: string | null;
  email: string | null;
}

export async function ensureUser(whatsappFrom: string): Promise<UserRow | null> {
  const canonical = normalizePhone(whatsappFrom);
  const legacy = whatsappFrom.replace(/^whatsapp:/i, '').trim();

  return withSupabase(
    'ensureUser',
    async (db) => {
      let { data: row } = await db
        .from('users')
        .select('phone_number, name, email')
        .eq('phone_number', canonical)
        .maybeSingle();

      if (!row && legacy !== canonical) {
        const second = await db
          .from('users')
          .select('phone_number, name, email')
          .eq('phone_number', legacy)
          .maybeSingle();
        row = second.data;
      }

      if (!row) {
        const { error } = await db.from('users').insert({ phone_number: canonical });
        if (error) {
          console.error('❌ Failed to register user:', error.message);
          return null;
        }
        return { phone_number: canonical, name: null, email: null };
      }

      return row as UserRow;
    },
    null,
  );
}

export async function updateUserContact(
  phone: string,
  fields: { name?: string; email?: string },
): Promise<void> {
  const canonical = normalizePhone(phone);
  await withSupabase(
    'updateUserContact',
    async (db) => {
      await db
        .from('users')
        .upsert({ phone_number: canonical, ...fields }, { onConflict: 'phone_number' });
    },
    undefined,
  );
}
