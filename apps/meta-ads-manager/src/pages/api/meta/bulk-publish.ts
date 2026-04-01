import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { metaAPI, MetaAPIError } from '@/lib/meta-api';
import { getUserAccounts } from '@/lib/supabase-rls';
import { buildAdsetPayloadExtras, buildCampaignPayloadExtras } from '@/lib/meta-ad-rules';
import { getAdsetTypeForCampaign } from '@/lib/distribution';

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
      status: 'running' as const,
      total_campaigns: distribution.length,
      completed_campaigns: 0,
      results: [],
    })
    .select()
    .single();

  if (jobError || !job) {
    return res.status(500).json({ error: 'Failed to create publish job' });
  }

  const jobId = job.id;

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

    // --- Helper: create full campaign + adsets + ads ---
    const createFullCampaign = async () => {
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
      const metaCampaignId = campaignResult!.id;
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
      // BR-028: cada campanha recebe exatamente UM tipo via distribuição em blocos
      const adsetType = getAdsetTypeForCampaign(adsetTypes, entry.campaignIndex, distribution.length);

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

          // end_time: enviar se existir
          if (adsetType.endDate) {
            adsetBody.end_time = adsetType.endDate;
          }

          // Payload extras: optimization_goal, promoted_object, bid_strategy, budget
          const extras = buildAdsetPayloadExtras({
            objective: campaignConfig.objective as string,
            pixelId: adsetType.pixelId ? String(adsetType.pixelId) : undefined,
            conversionEvent: adsetType.conversionEvent ? String(adsetType.conversionEvent) : undefined,
            bidStrategy: campaignConfig.bidStrategy as string,
            bidCapValue: typeof adsetType.bidCapValue === 'number' ? adsetType.bidCapValue : undefined,
            budgetType: campaignConfig.budgetType as 'CBO' | 'ABO',
            budgetValue: campaignConfig.budgetValue as number,
          });
          Object.assign(adsetBody, extras);

          const adsetResult = await metaAPI.createAdSet(metaAccountId, metaCampaignId, adsetBody, user.id);
          const metaAdsetId = adsetResult!.id;
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
          for (const creativeName of validCreatives) {
            const creativeFile = adConfig.creativeFiles.find((f: any) => f.fileName === creativeName);
            const rawUrl = creativeFile?.driveUrl || '';

            if (!rawUrl) continue;

            // Convert Google Drive download URL to direct serve URL (no redirect)
            let creativeUrl = rawUrl;
            const driveIdMatch = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (driveIdMatch) {
              creativeUrl = `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}=s0`;
            }

            // Video upload não implementado — pular
            if (creativeFile?.type === 'video') continue;

            // Append UTM params diretamente na URL (url_tags não funciona para inline ads com object_story_spec)
            let urlTags = '';
            if (adConfig.utmParams) {
              const params = new URLSearchParams();
              for (const [k, v] of Object.entries(adConfig.utmParams)) {
                if (v) params.set(k, v as string);
              }
              urlTags = params.toString();
            }

            let finalLink = adConfig.destinationUrl;
            if (urlTags) {
              const separator = adConfig.destinationUrl.includes('?') ? '&' : '?';
              finalLink = `${adConfig.destinationUrl}${separator}${urlTags}`;
            }

            const adBody: any = {
              name: adsetName,
              status: adsetType.adsetStatus,
              creative: {
                object_story_spec: {
                  page_id: entry.pageId,
                  link_data: {
                    message: adConfig.primaryText,
                    link: finalLink,
                    name: adConfig.headline,
                    description: adConfig.description,
                    picture: creativeUrl,
                    call_to_action: {
                      type: 'LEARN_MORE',
                      value: { link: finalLink },
                    },
                  },
                },
              },
            };

            // Tracking specs for pixel conversion tracking
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

      return metaCampaignId;
    };

    // --- Execute with retry on rate limit ---
    try {
      const metaCampaignId = await createFullCampaign();
      results.push({
        campaignIndex: entry.campaignIndex,
        status: 'success',
        meta_campaign_id: metaCampaignId,
        campaignName,
      });
    } catch (err: any) {
      console.error(`[bulk-publish] Erro campanha ${i} (conta ${entry.accountId}):`, err instanceof MetaAPIError ? err.toJSON() : err.message);
      const isRateLimit = err instanceof MetaAPIError
        ? (err.code === 17 || err.code === 32 || err.code === 4)
        : err.message?.includes('rate limit');

      if (isRateLimit) {
        // Backoff exponencial: 2s, 4s, 8s (com jitter)
        let retrySuccess = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          const backoffBase = 2000 * Math.pow(2, attempt);
          const backoffJitter = backoffBase + Math.random() * 1000;
          await delay(backoffJitter);

          try {
            // Retry cria campanha + adsets + ads completo (nao so campanha)
            const retryMetaCampaignId = await createFullCampaign();
            results.push({
              campaignIndex: entry.campaignIndex,
              status: 'success',
              meta_campaign_id: retryMetaCampaignId,
              campaignName,
            });
            retrySuccess = true;
            break;
          } catch (retryErr: any) {
            console.error(`[bulk-publish] Rate limit retry ${attempt + 1}/3 falhou:`, retryErr.message);
            if (attempt === 2) {
              // Ultimo attempt — registrar falha (unico push, sem duplicata)
              results.push({
                campaignIndex: entry.campaignIndex,
                status: 'failed',
                error: retryErr.message || 'Retry failed after 3 attempts',
                errorDetails: retryErr instanceof MetaAPIError ? retryErr.toJSON() : undefined,
                campaignName,
              });
              retrySuccess = true; // Marca para pular o fallback push abaixo
            }
          }
        }
        // Fallback: se nenhum attempt conseguiu registrar resultado (nao deveria acontecer)
        if (!retrySuccess) {
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
