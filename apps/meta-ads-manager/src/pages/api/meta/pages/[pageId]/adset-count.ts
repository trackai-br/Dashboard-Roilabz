import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';

const API_VERSION = process.env.META_API_VERSION || 'v23.0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { pageId } = req.query;
  if (!pageId || typeof pageId !== 'string') return res.status(400).json({ error: 'Missing pageId' });

  try {
    // Import getMetaToken dynamically to avoid issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    if (!supabaseAdmin) return res.status(500).json({ error: 'Server error' });

    const { data: conn } = await supabaseAdmin
      .from('meta_connections')
      .select('meta_access_token')
      .eq('user_id', user.id)
      .eq('connection_status', 'active')
      .single();

    if (!conn) return res.status(404).json({ error: 'No Meta connection', count: 0 });

    const token = (conn as any).meta_access_token;

    // Get summary count of adsets linked to this page
    const url = `https://graph.facebook.com/${API_VERSION}/${pageId}/ads?fields=id&summary=true&limit=0&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      // Page might not support this edge — return 0
      return res.status(200).json({ count: 0 });
    }

    const count = data.summary?.total_count || 0;
    return res.status(200).json({ count });
  } catch (e) {
    return res.status(200).json({ count: 0 });
  }
}
