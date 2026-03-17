import { inngest } from '../client';
import { createClient } from '@supabase/supabase-js';
import { metaAPI } from '@/lib/meta-api';
import { getUserAccounts } from '@/lib/supabase-rls';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabase;
}

interface BulkCreatePayload {
  userId: string;
  accountIds: string[];
  campaignBaseConfig: {
    campaignName: string;
    campaignObjective: string;
    campaignStatus: 'ACTIVE' | 'PAUSED';
    campaignStartTime?: string;
    campaignStopTime?: string;
    campaignDailyBudget?: number;
    campaignLifetimeBudget?: number;
    budgetType: 'daily' | 'lifetime';
  };
  adSetBaseConfig: {
    adSetName: string;
    adSetStatus: 'ACTIVE' | 'PAUSED';
    adSetDailyBudget?: number;
    adSetLifetimeBudget?: number;
    adSetTargeting: Record<string, any>;
    adSetBillingEvent: string;
    adSetBidStrategy: string;
    adSetBidAmount?: number;
  };
  adBaseConfig: {
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
  };
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

export const bulkCreateCampaigns = inngest.createFunction(
  { id: 'bulk-create-campaigns', retries: 2 },
  { event: 'bulk-create-campaigns' },
  async ({ event, step }) => {
    const data = event.data as BulkCreatePayload;

    const results = {
      successful: [] as Array<{ accountId: string; campaignId: string }>,
      failed: [] as Array<{ accountId: string; error: string }>,
    };

    // Get user accounts for meta account IDs
    const userAccounts = await getUserAccounts(data.userId);
    const accountMap = new Map(userAccounts.map((acc) => [acc.id, acc]));

    // Process each account in parallel
    for (const accountId of data.accountIds) {
      const account = accountMap.get(accountId);
      if (!account) {
        results.failed.push({
          accountId,
          error: 'Account not found or access denied',
        });
        continue;
      }

      const metaAccountId = account.meta_account_id;
      const overrides = data.overridesByAccount?.[accountId] || {};

      try {
        await step.run(`create-campaign-${accountId}`, async () => {
          // Get campaign name with override
          const campaignName = overrides.campaignName || data.campaignBaseConfig.campaignName;

          // Create campaign
          const campaignResult = await metaAPI.createCampaign(metaAccountId, {
            name: campaignName,
            objective: data.campaignBaseConfig.campaignObjective,
            status: data.campaignBaseConfig.campaignStatus,
            ...(data.campaignBaseConfig.budgetType === 'daily' && {
              daily_budget: data.campaignBaseConfig.campaignDailyBudget,
            }),
            ...(data.campaignBaseConfig.budgetType === 'lifetime' && {
              lifetime_budget: data.campaignBaseConfig.campaignLifetimeBudget,
              start_time: data.campaignBaseConfig.campaignStartTime,
              stop_time: data.campaignBaseConfig.campaignStopTime,
            }),
          });

          const campaignId = campaignResult.id;

          // Get ad set budget with override
          const adSetDailyBudget =
            overrides.adSetDailyBudget || data.adSetBaseConfig.adSetDailyBudget;

          // Create ad set
          const adSetResult = await metaAPI.createAdSet(campaignId, {
            name: data.adSetBaseConfig.adSetName,
            status: data.adSetBaseConfig.adSetStatus,
            targeting: data.adSetBaseConfig.adSetTargeting,
            billing_event: data.adSetBaseConfig.adSetBillingEvent,
            bid_strategy: data.adSetBaseConfig.adSetBidStrategy,
            ...(adSetDailyBudget && { daily_budget: adSetDailyBudget }),
            ...(data.adSetBaseConfig.adSetBidAmount && {
              bid_amount: data.adSetBaseConfig.adSetBidAmount,
            }),
          });

          const adSetId = adSetResult.id;

          // Get page and pixel with overrides
          const pageId = overrides.pageId || data.adBaseConfig.pageId;
          const pixelId = overrides.pixelId || data.adBaseConfig.pixelId;

          // Create creative spec
          const creativeSpec = {
            object_story_spec: {
              page_id: pageId,
              link_data: {
                message: data.adBaseConfig.creativeBody,
                link: data.adBaseConfig.creativeUrl,
                caption: data.adBaseConfig.creativeHeadline,
                ...(data.adBaseConfig.creativeImageUrl && {
                  image_hash: data.adBaseConfig.creativeImageUrl,
                }),
                ...(pixelId && { pixel_id: pixelId }),
              },
            },
          };

          // Create ad
          const adResult = await metaAPI.createAd(adSetId, {
            name: data.adBaseConfig.adName,
            status: data.adBaseConfig.adStatus,
            adset_spec: creativeSpec,
          });

          const adId = adResult.id;

          // Store in database
          const { data: storedAccount, error: accountError } = await getSupabase()
            .from('meta_accounts')
            .select('id')
            .eq('meta_account_id', metaAccountId)
            .single();

          if (!accountError && storedAccount) {
            const storedAccountId = storedAccount.id;

            // Store campaign
            await getSupabase()
              .from('meta_ads_campaigns')
              .insert({
                meta_account_id: storedAccountId,
                campaign_id: campaignId,
                campaign_name: campaignName,
                status: data.campaignBaseConfig.campaignStatus,
                objective: data.campaignBaseConfig.campaignObjective,
                daily_budget_micros: data.campaignBaseConfig.campaignDailyBudget,
                budget_amount_micros: data.campaignBaseConfig.campaignLifetimeBudget,
                start_time: data.campaignBaseConfig.campaignStartTime,
                end_time: data.campaignBaseConfig.campaignStopTime,
                last_synced: new Date(),
              } as any);

            // Store ad set
            await getSupabase().from('meta_ad_sets').insert({
              meta_account_id: storedAccountId,
              campaign_id: campaignId,
              adset_id: adSetId,
              name: data.adSetBaseConfig.adSetName,
              status: data.adSetBaseConfig.adSetStatus,
              daily_budget: adSetDailyBudget,
              targeting: data.adSetBaseConfig.adSetTargeting,
              billing_event: data.adSetBaseConfig.adSetBillingEvent,
              bid_strategy: data.adSetBaseConfig.adSetBidStrategy,
              bid_amount: data.adSetBaseConfig.adSetBidAmount,
              last_synced: new Date(),
            } as any);

            // Store ad
            await getSupabase().from('meta_ads').insert({
              meta_account_id: storedAccountId,
              adset_id: adSetId,
              ad_id: adId,
              name: data.adBaseConfig.adName,
              status: data.adBaseConfig.adStatus,
              creative_spec: creativeSpec,
              last_synced: new Date(),
            } as any);
          }

          results.successful.push({
            accountId,
            campaignId,
          });
        });
      } catch (accountError) {
        const message =
          accountError instanceof Error ? accountError.message : 'Unknown error';
        results.failed.push({
          accountId,
          error: message,
        });
      }
    }

    return {
      success: results.failed.length === 0,
      results,
      totalAccounts: data.accountIds.length,
      successCount: results.successful.length,
      failureCount: results.failed.length,
    };
  }
);
