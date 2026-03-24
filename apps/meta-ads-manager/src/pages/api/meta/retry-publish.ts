import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { metaAPI } from '@/lib/meta-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { jobId, campaignIndex, distribution, campaignConfig, adsetTypes, adConfig } = req.body;
  if (!jobId || campaignIndex === undefined) {
    return res.status(400).json({ error: 'Missing jobId or campaignIndex' });
  }

  // Get the job
  const { data: job, error: jobError } = await supabase
    .from('publish_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (jobError || !job) return res.status(404).json({ error: 'Job not found' });

  const entry = distribution?.find((d: any) => d.campaignIndex === campaignIndex);
  if (!entry) return res.status(400).json({ error: 'Campaign entry not found in distribution' });

  const userAccounts = await getUserAccounts(user.id);
  const account = userAccounts.find((a: any) => a.meta_account_id === entry.accountId);
  const metaAccountId = account?.meta_account_id || entry.accountId;
  const accountName = (account as any)?.meta_account_name || entry.accountId;

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  const cpNum = String(entry.campaignIndex + 1).padStart(2, '0');
  const suffix = Math.random().toString(16).slice(2, 6);
  const campaignName = `[${dateStr}][${accountName}][CP ${cpNum}][LEVA ${campaignConfig.namingPattern.levaNumber}][${entry.pageName}] ${campaignConfig.namingPattern.creativeLabel} #${suffix}`;

  try {
    const campaignResult = await metaAPI.createCampaign(metaAccountId, {
      name: campaignName,
      objective: campaignConfig.objective,
      status: campaignConfig.campaignStatus,
      ...(campaignConfig.budgetType === 'CBO' && { daily_budget: campaignConfig.budgetValue }),
    }, user.id);

    // Update result in job
    const results = ((job as any).results || []) as any[];
    const idx = results.findIndex((r: any) => r.campaignIndex === campaignIndex);
    const newResult = {
      campaignIndex,
      status: 'success',
      meta_campaign_id: campaignResult.id,
      campaignName,
    };
    if (idx >= 0) results[idx] = newResult;
    else results.push(newResult);

    const allDone = results.every((r: any) => r.status === 'success');
    await supabase
      .from('publish_jobs')
      .update({ results, status: allDone ? 'completed' : 'partial', updated_at: new Date().toISOString() } as any)
      .eq('id', jobId);

    return res.status(200).json({ success: true, result: newResult });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Retry failed' });
  }
}
