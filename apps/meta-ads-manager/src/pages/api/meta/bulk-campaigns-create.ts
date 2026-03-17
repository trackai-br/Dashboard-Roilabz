import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { inngest } from '@/inngest/client';

interface BulkCreateRequest {
  // Campaign base config
  campaignName: string;
  campaignObjective: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
  campaignStartTime?: string;
  campaignStopTime?: string;
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  budgetType: 'daily' | 'lifetime';

  // Ad Set base config
  adSetName: string;
  adSetStatus: 'ACTIVE' | 'PAUSED';
  adSetDailyBudget?: number;
  adSetLifetimeBudget?: number;
  adSetTargeting: Record<string, any>;
  adSetBillingEvent: string;
  adSetBidStrategy: string;
  adSetBidAmount?: number;

  // Ad base config
  adName: string;
  adStatus: 'ACTIVE' | 'PAUSED';
  creativeHeadline: string;
  creativeBody: string;
  creativeUrl: string;
  creativeImageUrl?: string;
  creativeVideoUrl?: string;
  pixelId?: string;
  pageId: string;
  creativeFormat: 'single_image' | 'single_video' | 'carousel' | 'collection';

  // Accounts to deploy to with optional overrides
  accountIds: string[];
  overridesByAccount?: Record<
    string,
    {
      campaignName?: string;
      adSetDailyBudget?: number;
      pageId?: string;
      pixelId?: string;
    }
  >;
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
    const data: BulkCreateRequest = req.body;

    // Validate request
    if (!data.accountIds || data.accountIds.length === 0) {
      return res.status(400).json({ error: 'No accounts selected' });
    }

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    const selectedAccounts = userAccounts.filter((acc) => data.accountIds.includes(acc.id));

    if (selectedAccounts.length === 0) {
      return res.status(403).json({ error: 'Access denied to selected accounts' });
    }

    // Queue Inngest job for bulk creation
    const result = await inngest.send({
      name: 'bulk-create-campaigns',
      data: {
        userId,
        accountIds: selectedAccounts.map((acc) => acc.id),
        campaignBaseConfig: {
          campaignName: data.campaignName,
          campaignObjective: data.campaignObjective,
          campaignStatus: data.campaignStatus,
          campaignStartTime: data.campaignStartTime,
          campaignStopTime: data.campaignStopTime,
          campaignDailyBudget: data.campaignDailyBudget,
          campaignLifetimeBudget: data.campaignLifetimeBudget,
          budgetType: data.budgetType,
        },
        adSetBaseConfig: {
          adSetName: data.adSetName,
          adSetStatus: data.adSetStatus,
          adSetDailyBudget: data.adSetDailyBudget,
          adSetLifetimeBudget: data.adSetLifetimeBudget,
          adSetTargeting: data.adSetTargeting,
          adSetBillingEvent: data.adSetBillingEvent,
          adSetBidStrategy: data.adSetBidStrategy,
          adSetBidAmount: data.adSetBidAmount,
        },
        adBaseConfig: {
          adName: data.adName,
          adStatus: data.adStatus,
          creativeHeadline: data.creativeHeadline,
          creativeBody: data.creativeBody,
          creativeUrl: data.creativeUrl,
          creativeImageUrl: data.creativeImageUrl,
          creativeVideoUrl: data.creativeVideoUrl,
          pixelId: data.pixelId,
          pageId: data.pageId,
          creativeFormat: data.creativeFormat,
        },
        overridesByAccount: data.overridesByAccount || {},
      },
    });

    return res.status(202).json({
      success: true,
      jobId: result.ids?.[0],
      message: 'Bulk campaign creation queued',
      accountsSelected: selectedAccounts.length,
    });
  } catch (error) {
    console.error('Error queuing bulk campaign creation:', error);
    return res.status(500).json({
      error: 'Failed to queue bulk creation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
