import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { metaAPI } from '@/lib/meta-api';

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

    const { campaignId } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId is required' });
    }

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    if (userAccounts.length === 0) {
      return res.status(200).json({ adsets: [] });
    }

    // Check if user has access to this campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('meta_ads_campaigns')
      .select('meta_account_id')
      .eq('campaign_id', campaignId as string)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Verify user has access — campaign.meta_account_id is a UUID (FK to meta_accounts.id)
    const hasAccess = userAccounts.some((acc: any) => acc.id === campaign.meta_account_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch ad sets from database
    const { data: adsets, error } = await supabase
      .from('meta_ad_sets')
      .select('*')
      .eq('campaign_id', campaignId as string)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch ad sets' });
    }

    return res.status(200).json({
      adsets: adsets || [],
      count: adsets?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching ad sets:', error);
    return res.status(500).json({
      error: 'Failed to fetch ad sets',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
