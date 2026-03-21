import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server error' });

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== 'string') return res.status(400).json({ error: 'Missing jobId' });

  const { data, error } = await (supabaseAdmin as any)
    .from('publish_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Job not found' });

  return res.status(200).json({
    id: data.id,
    status: data.status,
    totalCampaigns: data.total_campaigns,
    completedCampaigns: data.completed_campaigns,
    results: data.results || [],
  });
}
