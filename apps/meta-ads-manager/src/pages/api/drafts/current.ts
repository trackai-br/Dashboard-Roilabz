import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server error' });

  if (req.method === 'GET') {
    const { data, error } = await (supabaseAdmin as any)
      .from('campaign_drafts')
      .select('id, state_json, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return res.status(404).json({ error: 'No draft found' });
    return res.status(200).json({ id: (data as any).id, state: (data as any).state_json, updatedAt: (data as any).updated_at });
  }

  if (req.method === 'DELETE') {
    const { error } = await (supabaseAdmin as any)
      .from('campaign_drafts')
      .delete()
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
