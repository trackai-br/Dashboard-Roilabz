import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { metaAPI, MetaAPIError } from '@/lib/meta-api';
import { getUserAccounts } from '@/lib/supabase-rls';

// Vercel serverless: extend timeout (Pro plan = 60s, Hobby = 10s)
export const config = {
  maxDuration: 60,
};

const DELAY_MIN_MS = 800;
const DELAY_MAX_MS = 2000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Delay aleatorio entre min e max para simular cadencia humana */
function humanDelay() {
  const jitter = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
  return delay(Math.round(jitter));
}

/** Gera sufixo curto unico (4 chars hex) para evitar nomes duplicados */
function uniqueSuffix() {
  return Math.random().toString(16).slice(2, 6);
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
    const campaignName = `[${dateStr}][${accountName}][CP ${cpNum}][LEVA ${campaignConfig.namingPattern.levaNumber}][${entry.pageName}] ${campaignConfig.namingPattern.creativeLabel} #${uniqueSuffix()}`;

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

      console.log(`[bulk-publish] === CAMPANHA ${i} ===`);
      console.log(`[bulk-publish] createCampaign payload:`, JSON.stringify(campaignBody));
      const campaignResult = await metaAPI.createCampaign(metaAccountId, campaignBody, user.id);
      const metaCampaignId = campaignResult.id;
      console.log(`[bulk-publish] Campanha criada: ${metaCampaignId}`);
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
            start_time: adsetType.startDate,
          };

          // bid_strategy: so enviar quando NAO for o default E tiver os campos obrigatorios
          // Meta usa "custo mais baixo" automaticamente quando bid_strategy esta ausente
          const bidStrategy = campaignConfig.bidStrategy;
          const hasBidAmount = !!adsetType.bidCapValue;

          if (bidStrategy === 'LOWEST_COST_WITHOUT_CAP') {
            // Nao enviar — Meta defaults para custo mais baixo
            console.log(`[bulk-publish] bid_strategy: omitido (LOWEST_COST_WITHOUT_CAP = default Meta)`);
          } else if (['LOWEST_COST_WITH_BID_CAP', 'COST_CAP'].includes(bidStrategy) && hasBidAmount) {
            adsetBody.bid_strategy = bidStrategy;
            adsetBody.bid_amount = adsetType.bidCapValue;
            console.log(`[bulk-publish] bid_strategy: ${bidStrategy}, bid_amount: ${adsetType.bidCapValue}`);
          } else if (bidStrategy === 'LOWEST_COST_WITH_MIN_ROAS') {
            // ROAS minimo precisa de roas_average_floor — nao implementado, omitir
            console.warn(`[bulk-publish] bid_strategy ROAS minimo sem roas_average_floor — omitindo bid_strategy`);
          } else {
            console.warn(`[bulk-publish] bid_strategy "${bidStrategy}" sem bid_amount — omitindo bid_strategy`);
          }

          if (campaignConfig.budgetType === 'ABO') {
            adsetBody.daily_budget = campaignConfig.budgetValue;
          }
          if (adsetType.pixelId) {
            adsetBody.promoted_object = {
              pixel_id: adsetType.pixelId,
              custom_event_type: adsetType.conversionEvent,
            };
            adsetBody.optimization_goal = 'OFFSITE_CONVERSIONS';
          }

          console.log(`[bulk-publish] createAdSet payload:`, JSON.stringify(adsetBody, null, 2));
          const adsetResult = await metaAPI.createAdSet(metaAccountId, metaCampaignId, adsetBody, user.id);
          const metaAdsetId = adsetResult.id;
          console.log(`[bulk-publish] AdSet criado: ${metaAdsetId}`);
          await humanDelay();

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
          const validCreatives = adsetType.creativesInAdset.filter(Boolean);
          console.log(`[bulk-publish] creativesInAdset (${validCreatives.length}):`, JSON.stringify(adsetType.creativesInAdset));
          if (validCreatives.length === 0) {
            console.warn(`[bulk-publish] WARNING: Nenhum criativo no adset "${adsetName}" — nenhum ad será criado`);
          }
          for (const creativeName of validCreatives) {
            const creativeFile = adConfig.creativeFiles.find((f: any) => f.fileName === creativeName);
            const rawUrl = creativeFile?.driveUrl || '';

            if (!rawUrl) {
              console.warn(`[bulk-publish] WARNING: No driveUrl for creative "${creativeName}" — skipping ad (no media)`);
              continue;
            }

            // Convert Google Drive download URL to direct serve URL (no redirect)
            let creativeUrl = rawUrl;
            const driveIdMatch = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (driveIdMatch) {
              creativeUrl = `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}=s0`;
            }
            console.log(`[bulk-publish] Ad creative URL: ${creativeUrl} (file: ${creativeName})`);

            const isVideo = creativeFile?.type === 'video';
            if (isVideo) {
              console.warn(`[bulk-publish] Creative "${creativeName}" is a video — video upload not yet implemented, skipping`);
              continue;
            }

            // Build URL tags from UTM params
            let urlTags = '';
            if (adConfig.utmParams) {
              const params = new URLSearchParams();
              for (const [k, v] of Object.entries(adConfig.utmParams)) {
                if (v) params.set(k, v as string);
              }
              urlTags = params.toString();
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
                    description: adConfig.description,
                    picture: creativeUrl,
                    call_to_action: {
                      type: 'LEARN_MORE',
                      value: { link: adConfig.destinationUrl },
                    },
                  },
                },
              },
            };

            // URL tags (UTM parameters) — campo da Meta API para params na URL
            if (urlTags) {
              adBody.url_tags = urlTags;
            }

            // Tracking specs for pixel conversion tracking
            if (adsetType.pixelId) {
              adBody.tracking_specs = [{ 'action.type': ['offsite_conversion'], fb_pixel: [adsetType.pixelId] }];
            }

            console.log(`[bulk-publish] createAd payload:`, JSON.stringify(adBody, null, 2));
            const adResult = await metaAPI.createAd(metaAccountId, metaAdsetId, adBody, user.id);
            console.log(`[bulk-publish] Ad criado: ${adResult.id}`);
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

      results.push({
        campaignIndex: entry.campaignIndex,
        status: 'success',
        meta_campaign_id: metaCampaignId,
        campaignName,
      });
    } catch (err: any) {
      console.error(`[bulk-publish] ERRO na campanha ${i}:`, err instanceof MetaAPIError ? JSON.stringify(err.toJSON(), null, 2) : err.message);
      const isRateLimit = err instanceof MetaAPIError
        ? (err.code === 17 || err.code === 32 || err.code === 4)
        : err.message?.includes('rate limit');

      if (isRateLimit) {
        // Backoff exponencial: 2s, 4s, 8s (com jitter)
        let retrySuccess = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          const backoffBase = 2000 * Math.pow(2, attempt);
          const backoffJitter = backoffBase + Math.random() * 1000;
          console.log(`[bulk-publish] Rate limit — retry ${attempt + 1}/3 em ${Math.round(backoffJitter)}ms`);
          await delay(backoffJitter);

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
            retrySuccess = true;
            break;
          } catch (retryErr: any) {
            if (attempt === 2) {
              results.push({
                campaignIndex: entry.campaignIndex,
                status: 'failed',
                error: retryErr.message || 'Retry failed after 3 attempts',
                errorDetails: retryErr instanceof MetaAPIError ? retryErr.toJSON() : undefined,
                campaignName,
              });
            }
          }
        }
        if (!retrySuccess && !results.find(r => r.campaignIndex === entry.campaignIndex)) {
          results.push({
            campaignIndex: entry.campaignIndex,
            status: 'failed',
            error: 'Rate limit — retries esgotados',
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
