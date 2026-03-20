import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server error' });

  const { state } = req.body;
  if (!state) return res.status(400).json({ error: 'Missing state' });

  const { data, error } = await (supabaseAdmin as any)
    .from('campaign_drafts')
    .upsert(
      { user_id: user.id, state_json: state, updated_at: new Date().toISOString() } as any,
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ id: (data as any)?.id });
}
