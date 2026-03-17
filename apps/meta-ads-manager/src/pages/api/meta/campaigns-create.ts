import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { metaAPI } from '@/lib/meta-api';

interface CreateCampaignRequest {
  // Campaign
  campaignName: string;
  campaignObjective: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
  campaignStartTime?: string;
  campaignStopTime?: string;
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;

  // Ad Set
  adSetName: string;
  adSetStatus: 'ACTIVE' | 'PAUSED';
  adSetDailyBudget?: number;
  adSetLifetimeBudget?: number;
  adSetTargeting: Record<string, any>;
  adSetBillingEvent: string;
  adSetBidStrategy: string;
  adSetBidAmount?: number;

  // Ad
  adName: string;
  adStatus: 'ACTIVE' | 'PAUSED';
  creativeHeadline: string;
  creativeBody: string;
  creativeUrl: string;
  creativeImageUrl?: string;
  creativeVideoUrl?: string;
  pixelId?: string;
  pageId: string;

  // Account selection
  accountId: string;
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

  if (req.method === 'POST') {
    return handlePost(req, res, user.id);
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const data: CreateCampaignRequest = req.body;

    // Validate request
    if (
      !data.campaignName ||
      !data.campaignObjective ||
      !data.adSetName ||
      !data.adName ||
      !data.pageId ||
      !data.accountId
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    const account = userAccounts.find((acc) => acc.id === data.accountId);

    if (!account) {
      return res.status(403).json({ error: 'Access denied to this account' });
    }

    const metaAccountId = account.meta_account_id;

    try {
      // Step 1: Create Campaign
      const campaignResult = await metaAPI.createCampaign(metaAccountId, {
        name: data.campaignName,
        objective: data.campaignObjective,
        status: data.campaignStatus,
        ...(data.campaignDailyBudget && {
          daily_budget: data.campaignDailyBudget,
        }),
        ...(data.campaignLifetimeBudget && {
          lifetime_budget: data.campaignLifetimeBudget,
        }),
        ...(data.campaignStartTime && { start_time: data.campaignStartTime }),
        ...(data.campaignStopTime && { stop_time: data.campaignStopTime }),
      });

      const campaignId = campaignResult.id;

      // Step 2: Create Ad Set
      const adSetResult = await metaAPI.createAdSet(campaignId, {
        name: data.adSetName,
        status: data.adSetStatus,
        targeting: data.adSetTargeting,
        billing_event: data.adSetBillingEvent,
        bid_strategy: data.adSetBidStrategy,
        ...(data.adSetDailyBudget && {
          daily_budget: data.adSetDailyBudget,
        }),
        ...(data.adSetLifetimeBudget && {
          lifetime_budget: data.adSetLifetimeBudget,
        }),
        ...(data.adSetBidAmount && { bid_amount: data.adSetBidAmount }),
      });

      const adSetId = adSetResult.id;

      // Step 3: Create Creative (in-memory for now, would need proper API call)
      // For now, we'll store the creative data in the ad
      const creativeSpec = {
        object_story_spec: {
          page_id: data.pageId,
          link_data: {
            message: data.creativeBody,
            link: data.creativeUrl,
            caption: data.creativeHeadline,
            ...(data.creativeImageUrl && { image_hash: data.creativeImageUrl }),
            ...(data.pixelId && { pixel_id: data.pixelId }),
          },
        },
      };

      // Step 4: Create Ad
      const adResult = await metaAPI.createAd(adSetId, {
        name: data.adName,
        status: data.adStatus,
        adset_spec: creativeSpec,
      });

      const adId = adResult.id;

      // Step 5: Store in database
      // Get stored account ID
      const { data: storedAccount, error: accountError } = await supabase
        .from('meta_accounts')
        .select('id')
        .eq('meta_account_id', metaAccountId)
        .single();

      if (accountError || !storedAccount) {
        throw new Error('Could not find stored account');
      }

      // Store campaign (with error handling)
      const { error: campaignError } = await supabase
        .from('meta_ads_campaigns')
        .insert({
          meta_account_id: storedAccount.id,
          campaign_id: campaignId,
          campaign_name: data.campaignName,
          status: data.campaignStatus,
          objective: data.campaignObjective,
          daily_budget_micros: data.campaignDailyBudget ? Math.round(data.campaignDailyBudget * 1000000) : null,
          budget_amount_micros: data.campaignLifetimeBudget ? Math.round(data.campaignLifetimeBudget * 1000000) : null,
          start_time: data.campaignStartTime,
          end_time: data.campaignStopTime,
          last_synced: new Date(),
        } as any);

      if (campaignError) {
        console.error('Failed to store campaign:', campaignError);
        throw new Error(`Campaign stored in Meta but not in DB: ${campaignError.message}`);
      }

      // Store ad set (with error handling)
      const { error: adSetError } = await supabase
        .from('meta_ad_sets')
        .insert({
          meta_account_id: storedAccount.id,
          campaign_id: campaignId,
          adset_id: adSetId,
          name: data.adSetName,
          status: data.adSetStatus,
          daily_budget: data.adSetDailyBudget ? Math.round(data.adSetDailyBudget * 1000000) : null,
          lifetime_budget: data.adSetLifetimeBudget ? Math.round(data.adSetLifetimeBudget * 1000000) : null,
          targeting: data.adSetTargeting,
          billing_event: data.adSetBillingEvent,
          bid_strategy: data.adSetBidStrategy,
          bid_amount: data.adSetBidAmount,
          last_synced: new Date(),
        } as any);

      if (adSetError) {
        console.error('Failed to store ad set:', adSetError);
        throw new Error(`Ad Set created in Meta but not in DB: ${adSetError.message}`);
      }

      // Store ad (with error handling)
      const { error: adError } = await supabase.from('meta_ads').insert({
        meta_account_id: storedAccount.id,
        adset_id: adSetId,
        ad_id: adId,
        name: data.adName,
        status: data.adStatus,
        creative_spec: creativeSpec,
        last_synced: new Date(),
      } as any);

      if (adError) {
        console.error('Failed to store ad:', adError);
        throw new Error(`Ad created in Meta but not in DB: ${adError.message}`);
      }

      return res.status(201).json({
        success: true,
        campaignId,
        adSetId,
        adId,
        message: 'Campaign created successfully',
      });
    } catch (metaError) {
      const message =
        metaError instanceof Error ? metaError.message : 'Unknown error';
      console.error('Meta API error:', message);

      return res.status(500).json({
        error: 'Failed to create campaign',
        details: message,
      });
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
