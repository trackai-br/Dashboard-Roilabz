import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not initialized' });
    }

    const { data: logs, error } = await supabaseAdmin
      .from('sync_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch sync logs' });
    }

    return res.status(200).json({ logs: logs || [] });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'unknown',
    });
  }
}
