import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { metaAPI } from '@/lib/meta-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // First try to get accounts from DB
    if (supabaseAdmin) {
      const { data: dbAccounts, error: dbError } = await supabaseAdmin
        .from('meta_accounts')
        .select('id, meta_account_id, meta_account_name, currency, timezone');

      if (!dbError && dbAccounts && dbAccounts.length > 0) {
        return res.status(200).json({
          accounts: dbAccounts.map((a: any) => ({
            id: a.meta_account_id,
            name: a.meta_account_name,
            currency: a.currency,
            timezone: a.timezone,
          })),
        });
      }
    }

    // Fallback: fetch directly from Meta API
    const accounts = await metaAPI.getAdAccounts(user.id);
    return res.status(200).json({
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        timezone: a.timezone,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: msg, accounts: [] });
  }
}
