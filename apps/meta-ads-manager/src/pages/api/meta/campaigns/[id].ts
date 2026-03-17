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

  if (req.method === 'PUT') {
    return handlePut(req, res, user.id);
  }

  res.setHeader('Allow', ['PUT']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { id: campaignId } = req.query;
    const updates = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    if (userAccounts.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user has access to this campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('meta_ads_campaigns')
      .select('meta_account_id, campaign_id')
      .eq('id', campaignId as string)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const hasAccess = userAccounts.some((acc) => acc.id === campaign.meta_account_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      // Update via Meta API
      await metaAPI.updateCampaign(campaign.campaign_id, updates);

      // Update in database
      const { error: updateError } = await supabase
        .from('meta_ads_campaigns')
        .update({
          ...updates,
          updated_at: new Date(),
        })
        .eq('id', campaignId as string);

      if (updateError) {
        console.error('Database update error:', updateError);
      }

      return res.status(200).json({
        success: true,
        campaignId,
        message: 'Campaign updated successfully',
      });
    } catch (metaError) {
      const message =
        metaError instanceof Error ? metaError.message : 'Unknown error';
      console.error('Meta API error:', message);

      return res.status(500).json({
        error: 'Failed to update campaign',
        details: message,
      });
    }
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
