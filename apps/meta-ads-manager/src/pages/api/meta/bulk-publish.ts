import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { metaAPI, MetaAPIError } from '@/lib/meta-api';
import { getUserAccounts } from '@/lib/supabase-rls';

// Vercel serverless: extend timeout (Pro plan = 60s, Hobby = 10s)
export const config = {
  maxDuration: 60,
};

const DELAY_MS = 500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { distribution, campaignConfig, adsetTypes, adConfig } = req.body;
  if (!distribution || !campaignConfig || !adsetTypes || !adConfig) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get user accounts via user_account_access join (meta_accounts has no user_id column)
  let userAccounts: any[];
  try {
    userAccounts = await getUserAccounts(user.id);
  } catch (err) {
    console.error('[bulk-publish] Error fetching user accounts:', err);
    return res.status(500).json({ error: 'Failed to fetch accounts' });
  }

  if (userAccounts.length === 0) {
    return res.status(400).json({ error: 'Nenhuma conta encontrada. Sincronize primeiro.' });
  }

  const accountMap = new Map(userAccounts.map((a: any) => [a.meta_account_id, a]));

  // Create publish job
  const { data: job, error: jobError } = await supabase
    .from('publish_jobs')
    .insert({
      user_id: user.id,
      status: 'running',
      total_campaigns: distribution.length,
      completed_campaigns: 0,
      results: [],
    } as any)
    .select()
    .single();

  if (jobError || !job) {
    return res.status(500).json({ error: 'Failed to create publish job' });
  }

  const jobId = (job as any).id;

  // Process campaigns SYNCHRONOUSLY (Vercel kills functions after response)
  const results: any[] = [];
  let completed = 0;
  const startTime = Date.now();
  const MAX_DURATION_MS = 50000; // 50s safety margin under 60s Vercel limit

  for (let i = 0; i < distribution.length; i++) {
    // Timeout guard — mark remaining as timeout and return partial results
    if (Date.now() - startTime > MAX_DURATION_MS) {
      for (let j = i; j < distribution.length; j++) {
        results.push({
          campaignIndex: distribution[j].campaignIndex,
          status: 'failed',
          error: 'Timeout: tempo limite do servidor atingido. Tente publicar menos campanhas por vez.',
        });
      }
      break;
    }

    const entry = distribution[i];
    const account = accountMap.get(entry.accountId);
    const metaAccountId = account?.meta_account_id || entry.accountId;
    const accountName = account?.meta_account_name || entry.accountId;

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
    const cpNum = String(entry.campaignIndex + 1).padStart(2, '0');
    const campaignName = `[${dateStr}][${accountName}][CP ${cpNum}][LEVA ${campaignConfig.namingPattern.levaNumber}][${entry.pageName}] ${campaignConfig.namingPattern.creativeLabel}`;

    try {
      // 1. Create Campaign
      const campaignBody: any = {
        name: campaignName,
        objective: campaignConfig.objective,
        status: campaignConfig.campaignStatus,
        special_ad_categories: [],
      };
      if (campaignConfig.budgetType === 'CBO') {
        campaignBody.daily_budget = campaignConfig.budgetValue;
      }

      const campaignResult = await metaAPI.createCampaign(metaAccountId, campaignBody, user.id);
      const metaCampaignId = campaignResult.id;
      await delay(DELAY_MS);

      // Store campaign in DB
      const { data: storedAccount } = await supabase
        .from('meta_accounts')
        .select('id')
        .eq('meta_account_id', metaAccountId)
        .single();

      if (storedAccount) {
        await supabase.from('meta_ads_campaigns').insert({
          meta_account_id: (storedAccount as any).id,
          campaign_id: metaCampaignId,
          campaign_name: campaignName,
          status: campaignConfig.campaignStatus,
          objective: campaignConfig.objective,
          daily_budget_micros: campaignConfig.budgetType === 'CBO' ? campaignConfig.budgetValue * 10000 : null,
          last_synced: new Date(),
        } as any);
      }

      // 2. Create Adsets for this campaign
      const typesForCampaign = adsetTypes.filter(
        (t: any) => t.campaignsCount > i || adsetTypes.length === 1
      );

      for (const adsetType of typesForCampaign) {
        for (let a = 0; a < adsetType.adsetCount; a++) {
          const adsetSuffix = adsetType.adsetCount > 1 ? ` ${String(a + 1).padStart(2, '0')}` : '';
          const adsetName = `${adsetType.name}${adsetSuffix}`;

          const adsetBody: any = {
            name: adsetName,
            status: adsetType.adsetStatus,
            targeting: { geo_locations: { countries: adsetType.targetCountries } },
            billing_event: 'IMPRESSIONS',
            bid_strategy: campaignConfig.bidStrategy,
            start_time: adsetType.startDate,
          };

          if (campaignConfig.budgetType === 'ABO') {
            adsetBody.daily_budget = campaignConfig.budgetValue;
          }
          if (adsetType.bidCapValue) {
            adsetBody.bid_amount = adsetType.bidCapValue;
          }
          if (adsetType.pixelId) {
            adsetBody.promoted_object = {
              pixel_id: adsetType.pixelId,
              custom_event_type: adsetType.conversionEvent,
            };
          }

          const adsetResult = await metaAPI.createAdSet(metaAccountId, metaCampaignId, adsetBody, user.id);
          const metaAdsetId = adsetResult.id;
          await delay(DELAY_MS);

          // Store adset in DB
          if (storedAccount) {
            await supabase.from('meta_ad_sets').insert({
              meta_account_id: (storedAccount as any).id,
              campaign_id: metaCampaignId,
              adset_id: metaAdsetId,
              name: adsetName,
              status: adsetType.adsetStatus,
              targeting: { geo_locations: { countries: adsetType.targetCountries } },
              billing_event: 'IMPRESSIONS',
              bid_strategy: campaignConfig.bidStrategy,
              last_synced: new Date(),
            } as any);
          }

          // 3. Create Ads (1 per creative in adset type)
          for (const creativeName of adsetType.creativesInAdset.filter(Boolean)) {
            const creativeFile = adConfig.creativeFiles.find((f: any) => f.fileName === creativeName);
            const creativeUrl = creativeFile?.driveUrl || '';

            console.log(`[bulk-publish] Ad creative URL: ${creativeUrl || '(empty)'} (file: ${creativeName})`);
            if (!creativeUrl) {
              console.warn(`[bulk-publish] WARNING: No driveUrl for creative "${creativeName}" — ad will have no media`);
            }

            // TODO: Video creatives may need upload via POST /act_{id}/advideos instead of image_url.
            // Currently, videos are passed as image_url which may not work for all formats.
            // For reliable video ad creation, consider uploading via advideos endpoint first.
            const isVideo = creativeFile?.type === 'video';
            if (isVideo) {
              console.warn(`[bulk-publish] Creative "${creativeName}" is a video — using image_url fallback. Full video upload not yet implemented.`);
            }

            const adBody: any = {
              name: adsetName,
              status: adsetType.adsetStatus,
              creative: {
                object_story_spec: {
                  page_id: entry.pageId,
                  link_data: {
                    message: adConfig.primaryText,
                    link: adConfig.destinationUrl,
                    name: adConfig.headline,
                    caption: adConfig.description,
                    ...(creativeUrl && { image_url: creativeUrl }),
                  },
                },
              },
            };

            // Add UTM tracking
            if (adConfig.utmParams) {
              const params = new URLSearchParams();
              for (const [k, v] of Object.entries(adConfig.utmParams)) {
                if (v) params.set(k, v as string);
              }
              if (params.toString()) {
                adBody.tracking_specs = [{ 'action.type': ['offsite_conversion'], fb_pixel: [adsetType.pixelId] }];
              }
            }

            const adResult = await metaAPI.createAd(metaAccountId, metaAdsetId, adBody, user.id);
            await delay(DELAY_MS);

            if (storedAccount) {
              await supabase.from('meta_ads').insert({
                meta_account_id: (storedAccount as any).id,
                adset_id: metaAdsetId,
                ad_id: adResult.id,
                name: adsetName,
                status: adsetType.adsetStatus,
                creative_spec: adBody.creative,
                last_synced: new Date(),
              } as any);
            }
          }
        }
      }

      results.push({
        campaignIndex: entry.campaignIndex,
        status: 'success',
        meta_campaign_id: metaCampaignId,
        campaignName,
      });
    } catch (err: any) {
      const isRateLimit = err instanceof MetaAPIError
        ? (err.code === 17 || err.code === 32 || err.code === 4)
        : err.message?.includes('rate limit');

      if (isRateLimit) {
        await delay(5000);
        try {
          const retryResult = await metaAPI.createCampaign(metaAccountId, {
            name: campaignName,
            objective: campaignConfig.objective,
            status: campaignConfig.campaignStatus,
            special_ad_categories: [],
          }, user.id);
          results.push({
            campaignIndex: entry.campaignIndex,
            status: 'success',
            meta_campaign_id: retryResult.id,
            campaignName,
          });
        } catch (retryErr: any) {
          results.push({
            campaignIndex: entry.campaignIndex,
            status: 'failed',
            error: retryErr.message || 'Retry failed',
            errorDetails: retryErr instanceof MetaAPIError ? retryErr.toJSON() : undefined,
            campaignName,
          });
        }
      } else {
        results.push({
          campaignIndex: entry.campaignIndex,
          status: 'failed',
          error: err.message || 'Unknown error',
          errorDetails: err instanceof MetaAPIError ? err.toJSON() : undefined,
          campaignName,
        });
      }
    }

    completed++;
    // Update job progress in DB
    await supabase
      .from('publish_jobs')
      .update({
        completed_campaigns: completed,
        results,
        status: completed === distribution.length
          ? results.every((r: any) => r.status === 'success') ? 'completed' : 'partial'
          : 'running',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', jobId);
  }

  // Return final results synchronously
  const finalStatus = results.every((r) => r.status === 'success') ? 'completed' : 'partial';
  return res.status(200).json({
    jobId,
    status: finalStatus,
    total: distribution.length,
    completedCampaigns: completed,
    results,
  });
}
