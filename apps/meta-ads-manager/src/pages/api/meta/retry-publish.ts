import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { metaAPI } from '@/lib/meta-api';

const DELAY_MIN_MS = 800;
const DELAY_MAX_MS = 2000;

/** Mapeia objective de campanha para optimization_goal de adset (quando não tem pixel) */
function getOptimizationGoalForObjective(objective: string): string {
  const map: Record<string, string> = {
    OUTCOME_TRAFFIC: 'LINK_CLICKS',
    OUTCOME_AWARENESS: 'REACH',
    OUTCOME_ENGAGEMENT: 'POST_ENGAGEMENT',
    OUTCOME_LEADS: 'LEAD_GENERATION',
    OUTCOME_APP_PROMOTION: 'APP_INSTALLS',
    OUTCOME_SALES: 'OFFSITE_CONVERSIONS',
  };
  return map[objective] || 'LINK_CLICKS';
}

function humanDelay() {
  const jitter = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, Math.round(jitter)));
}

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
    await humanDelay();

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

    // 2. Create Adsets + Ads (same logic as bulk-publish)
    const typesForCampaign = (adsetTypes || []).filter(
      (t: any) => t.campaignsCount > campaignIndex || (adsetTypes || []).length === 1
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
          start_time: adsetType.startDate,
        };

        const bidStrategy = campaignConfig.bidStrategy;
        const hasBidAmount = !!adsetType.bidCapValue;

        if (bidStrategy === 'LOWEST_COST_WITHOUT_CAP') {
          // Default — omit
        } else if (['LOWEST_COST_WITH_BID_CAP', 'COST_CAP'].includes(bidStrategy) && hasBidAmount) {
          adsetBody.bid_strategy = bidStrategy;
          adsetBody.bid_amount = adsetType.bidCapValue;
        }

        if (campaignConfig.budgetType === 'ABO') {
          adsetBody.daily_budget = campaignConfig.budgetValue;
        }
        // optimization_goal: SEMPRE enviar (obrigatório na Meta API)
        if (adsetType.pixelId) {
          adsetBody.optimization_goal = 'OFFSITE_CONVERSIONS';
          adsetBody.promoted_object = {
            pixel_id: adsetType.pixelId,
            custom_event_type: adsetType.conversionEvent,
          };
        } else {
          adsetBody.optimization_goal = getOptimizationGoalForObjective(campaignConfig.objective);
        }

        const adsetResult = await metaAPI.createAdSet(metaAccountId, metaCampaignId, adsetBody, user.id);
        const metaAdsetId = adsetResult.id;
        await humanDelay();

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

        // 3. Create Ads
        const validCreatives = (adsetType.creativesInAdset || []).filter(Boolean);
        for (const creativeName of validCreatives) {
          const creativeFile = adConfig?.creativeFiles?.find((f: any) => f.fileName === creativeName);
          const rawUrl = creativeFile?.driveUrl || '';
          if (!rawUrl) continue;

          let creativeUrl = rawUrl;
          const driveIdMatch = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (driveIdMatch) {
            creativeUrl = `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}=s0`;
          }

          const isVideo = creativeFile?.type === 'video';
          if (isVideo) continue;

          let urlTags = '';
          if (adConfig?.utmParams) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(adConfig.utmParams)) {
              if (v) params.set(k, v as string);
            }
            urlTags = params.toString();
          }

          let finalLink = adConfig?.destinationUrl || '';
          if (urlTags && finalLink) {
            const separator = finalLink.includes('?') ? '&' : '?';
            finalLink = `${finalLink}${separator}${urlTags}`;
          }

          const adBody: any = {
            name: adsetName,
            status: adsetType.adsetStatus,
            creative: {
              object_story_spec: {
                page_id: entry.pageId,
                link_data: {
                  message: adConfig?.primaryText,
                  link: finalLink,
                  name: adConfig?.headline,
                  description: adConfig?.description,
                  picture: creativeUrl,
                  call_to_action: {
                    type: 'LEARN_MORE',
                    value: { link: finalLink },
                  },
                },
              },
            },
          };

          if (adsetType.pixelId) {
            adBody.tracking_specs = [{ 'action.type': ['offsite_conversion'], fb_pixel: [adsetType.pixelId] }];
          }

          const adResult = await metaAPI.createAd(metaAccountId, metaAdsetId, adBody, user.id);
          await humanDelay();

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

    // Update result in job
    const results = ((job as any).results || []) as any[];
    const idx = results.findIndex((r: any) => r.campaignIndex === campaignIndex);
    const newResult = {
      campaignIndex,
      status: 'success',
      meta_campaign_id: metaCampaignId,
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
