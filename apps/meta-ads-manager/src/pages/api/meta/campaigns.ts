import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, user.id);
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { accountId } = req.query;

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Get user's accounts from DB
    const userAccounts = await getUserAccounts(userId);
    if (userAccounts.length === 0) {
      return res.status(200).json({ campaigns: [], count: 0 });
    }

    // Filter by accountId if provided (uses internal DB id)
    const targetAccounts = accountId
      ? userAccounts.filter((acc: any) => acc.id === accountId)
      : userAccounts;

    if (targetAccounts.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const accountIds = targetAccounts.map((acc: any) => acc.id);
    const accountMap = new Map(
      targetAccounts.map((acc: any) => [acc.id, acc])
    );

    // Fetch campaigns from Supabase (source of truth)
    const { data: campaigns, error: dbError } = await supabaseAdmin
      .from('meta_ads_campaigns')
      .select(
        'id, meta_account_id, campaign_id, campaign_name, status, objective, ' +
        'daily_budget_micros, budget_amount_micros, spend_micros, impressions, clicks, ' +
        'cpc_micros, cpm_micros, ctr, conversions, roas, start_time, end_time, last_synced'
      )
      .in('meta_account_id', accountIds)
      .order('updated_at', { ascending: false });

    if (dbError) {
      console.error('[campaigns] DB error:', dbError.message);
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }

    // Get sync status for the accounts
    const { data: syncStatuses } = await (supabaseAdmin as any)
      .from('meta_sync_status')
      .select('meta_account_id, sync_type, last_synced_at, last_sync_status')
      .in('meta_account_id', accountIds)
      .in('sync_type', ['campaigns', 'insights']);

    // Format response to match frontend contract
    const formattedCampaigns = (campaigns || []).map((c: any) => {
      const account = accountMap.get(c.meta_account_id);
      return {
        id: c.campaign_id,
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        meta_account_id: account?.meta_account_id || '',
        account_name: account?.meta_account_name || '',
        status: c.status,
        objective: c.objective,
        daily_budget: c.daily_budget_micros ? String(c.daily_budget_micros) : undefined,
        lifetime_budget: c.budget_amount_micros ? String(c.budget_amount_micros) : undefined,
        start_time: c.start_time,
        end_time: c.end_time,
        metrics: {
          spend: String(c.spend_micros || 0),
          impressions: String(c.impressions || 0),
          clicks: String(c.clicks || 0),
          cpc: c.cpc_micros != null ? String(c.cpc_micros) : '0',
          cpm: c.cpm_micros != null ? String(c.cpm_micros) : '0',
          ctr: c.ctr != null ? String(c.ctr) : '0',
          conversions: String(c.conversions || 0),
          roas: c.roas != null ? String(c.roas) : undefined,
        },
      };
    });

    return res.status(200).json({
      campaigns: formattedCampaigns,
      count: formattedCampaigns.length,
      syncStatus: syncStatuses || [],
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({
      error: 'Failed to fetch campaigns',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
