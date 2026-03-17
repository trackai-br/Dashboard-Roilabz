import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { metaAPI } from '@/lib/meta-api';

interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  date_stop: string;
  status: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  inline_link_clicks?: string;
  landing_page_views?: string;
  cost_per_inline_link_click?: string;
  cost_per_landing_page_view?: string;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  actions?: Array<{ action_type: string; value: string }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const {
      accountId,
      dateStart,
      dateStop,
    } = req.query;

    // Validate and set default dates
    const getDefaultDateStart = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const getDefaultDateStop = () => new Date().toISOString().split('T')[0];

    // Validate date format (YYYY-MM-DD)
    const isValidDate = (date: string | undefined): boolean => {
      if (!date) return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(date);
    };

    if (!isValidDate(dateStart as string) || !isValidDate(dateStop as string)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const finalDateStart = (dateStart as string) || getDefaultDateStart();
    const finalDateStop = (dateStop as string) || getDefaultDateStop();

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    if (userAccounts.length === 0) {
      return res.status(200).json({ campaigns: [] });
    }

    // Filter by accountId if provided
    const targetAccounts = accountId
      ? userAccounts.filter((acc) => acc.id === accountId)
      : userAccounts;

    if (targetAccounts.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch campaigns from database using meta_account_id (TEXT IDs from Meta)
    const { data: campaigns, error } = await supabase
      .from('meta_ads_campaigns')
      .select('*')
      .in('meta_account_id', targetAccounts.map((acc) => acc.meta_account_id))
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }

    // Fetch insights for each campaign from Meta API
    const campaignsWithMetrics = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        try {
          const insights = await metaAPI.getInsights(
            campaign.campaign_id,
            finalDateStart,
            finalDateStop,
            'campaign'
          );

          // Aggregate insights (safely handle undefined/null values)
          const aggregated = insights.reduce(
            (acc, insight) => ({
              ...acc,
              impressions: (
                BigInt(acc.impressions ?? '0') + BigInt(insight.impressions ?? '0')
              ).toString(),
              clicks: (
                BigInt(acc.clicks ?? '0') + BigInt(insight.clicks ?? '0')
              ).toString(),
              spend: (
                BigInt(acc.spend ?? '0') + BigInt(insight.spend ?? '0')
              ).toString(),
              inline_link_clicks: (
                BigInt(acc.inline_link_clicks ?? '0') +
                BigInt(insight.inline_link_clicks ?? '0')
              ).toString(),
              landing_page_views: (
                BigInt(acc.landing_page_views ?? '0') +
                BigInt(insight.landing_page_views ?? '0')
              ).toString(),
              cpc: insight.cpc ?? acc.cpc,
              cpm: insight.cpm ?? acc.cpm,
              ctr: insight.ctr ?? acc.ctr,
              cost_per_inline_link_click: insight.cost_per_inline_link_click ?? acc.cost_per_inline_link_click,
              cost_per_landing_page_view: insight.cost_per_landing_page_view ?? acc.cost_per_landing_page_view,
              cost_per_action_type: insight.cost_per_action_type ?? acc.cost_per_action_type,
              actions: insight.actions ?? acc.actions,
            }),
            {} as CampaignMetrics
          );

          return {
            ...campaign,
            metrics: {
              date_start: finalDateStart,
              date_stop: finalDateStop,
              ...aggregated,
            },
          };
        } catch (err) {
          // Return campaign without metrics if API call fails
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
