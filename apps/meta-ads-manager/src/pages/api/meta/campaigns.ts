import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { metaAPI } from '@/lib/meta-api';

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
    const { accountId, dateStart, dateStop } = req.query;

    // Validate and set default dates
    const getDefaultDateStart = () =>
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const getDefaultDateStop = () =>
      new Date().toISOString().split('T')[0];

    const isValidDate = (date: string | undefined): boolean => {
      if (!date) return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(date);
    };

    if (!isValidDate(dateStart as string) || !isValidDate(dateStop as string)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const finalDateStart = (dateStart as string) || getDefaultDateStart();
    const finalDateStop = (dateStop as string) || getDefaultDateStop();

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

    // Fetch campaigns directly from Meta API for each account
    const allCampaigns: any[] = [];

    await Promise.all(
      targetAccounts.map(async (account: any) => {
        try {
          const { campaigns } = await metaAPI.getCampaigns(
            account.meta_account_id,
            undefined,
            100,
            undefined,
            userId
          );

          for (const campaign of campaigns) {
            allCampaigns.push({
              id: campaign.id,
              campaign_id: campaign.id,
              campaign_name: campaign.name,
              meta_account_id: account.meta_account_id,
              account_name: account.meta_account_name,
              status: campaign.effective_status || campaign.status,
              objective: campaign.objective,
              daily_budget: campaign.daily_budget,
              lifetime_budget: campaign.lifetime_budget,
              start_time: campaign.start_time,
              created_time: campaign.created_time,
            });
          }
        } catch (err) {
          console.error(
            `Error fetching campaigns for account ${account.meta_account_id}:`,
            err instanceof Error ? err.message : err
          );
        }
      })
    );

    // Fetch insights for each campaign from Meta API
    const campaignsWithMetrics = await Promise.all(
      allCampaigns.map(async (campaign) => {
        try {
          const insights = await metaAPI.getInsights(
            campaign.campaign_id,
            finalDateStart,
            finalDateStop,
            'campaign',
            userId
          );

          const safeAdd = (a: string | undefined, b: string | undefined) =>
            String(parseFloat(a || '0') + parseFloat(b || '0'));

          const aggregated = insights.reduce(
            (acc: any, insight: any) => ({
              ...acc,
              impressions: safeAdd(acc.impressions, insight.impressions),
              clicks: safeAdd(acc.clicks, insight.clicks),
              spend: safeAdd(acc.spend, insight.spend),
              inline_link_clicks: safeAdd(acc.inline_link_clicks, insight.inline_link_clicks),
              landing_page_views: safeAdd(acc.landing_page_views, insight.landing_page_views),
              cpc: insight.cpc ?? acc.cpc,
              cpm: insight.cpm ?? acc.cpm,
              ctr: insight.ctr ?? acc.ctr,
              cost_per_inline_link_click: insight.cost_per_inline_link_click ?? acc.cost_per_inline_link_click,
              cost_per_landing_page_view: insight.cost_per_landing_page_view ?? acc.cost_per_landing_page_view,
              cost_per_action_type: insight.cost_per_action_type ?? acc.cost_per_action_type,
              actions: insight.actions ?? acc.actions,
            }),
            {} as Record<string, any>
          );

          return {
            ...campaign,
            metrics: {
              ...aggregated,
              date_start: finalDateStart,
              date_stop: finalDateStop,
            },
          };
        } catch (err) {
          return {
            ...campaign,
            metrics: {
              date_start: finalDateStart,
              date_stop: finalDateStop,
            },
          };
        }
      })
    );

    return res.status(200).json({
      campaigns: campaignsWithMetrics,
      count: campaignsWithMetrics.length,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({
      error: 'Failed to fetch campaigns',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
