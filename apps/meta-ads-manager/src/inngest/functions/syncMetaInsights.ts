import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";
import { metaAPI, RateLimitError } from "@/lib/meta-api";
import type { RateLimitInfo } from "@/lib/meta-api";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
  }
  return supabase;
}

/**
 * Converte spend da Meta (string em unidades monetarias) para micros (centavos * 100).
 * Meta retorna spend como "12.34" (dolares). Convertemos para 1234 (centavos inteiros).
 */
function spendToMicros(spend: string | undefined): number {
  if (!spend) return 0;
  return Math.round(parseFloat(spend) * 100);
}

function toInt(val: string | undefined): number {
  if (!val) return 0;
  return parseInt(val, 10) || 0;
}

function toDecimal(val: string | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/**
 * Sync insights at account level using paginated batch calls.
 * Runs every 30 minutes. Uses adaptive rate limiting.
 *
 * Key optimization: GET /{account_id}/insights?level=campaign
 * returns ALL campaign insights in one paginated call (~20 pages for 10k campaigns)
 * vs 10,000 individual calls.
 */
export const syncMetaInsights = inngest.createFunction(
  { id: "sync-meta-insights", retries: 3 },
  { cron: "*/30 * * * *" },
  async ({ step }) => {
    const db = getSupabase();

    // Step 1: Get all accounts with their DB UUIDs
    const accounts = await step.run("fetch-accounts", async () => {
      const { data } = await db
        .from("meta_accounts")
        .select("id, meta_account_id");
      return (data || []) as Array<{ id: string; meta_account_id: string }>;
    });

    // Step 2: Sync insights for each account
    for (const account of accounts) {
      try {
        await step.run(`sync-insights-${account.meta_account_id}`, async () => {
          // Get last sync time for incremental fetch
          const { data: syncStatus } = await db
            .from("meta_sync_status")
            .select("last_synced_at")
            .eq("meta_account_id", account.id)
            .eq("sync_type", "insights")
            .single() as { data: { last_synced_at: string | null } | null };

          // Date range: last sync - 1 day (overlap for corrections) to today
          // If never synced: last 7 days
          const now = new Date();
          let dateStart: string;
          if (syncStatus?.last_synced_at) {
            const lastSync = new Date(syncStatus.last_synced_at);
            lastSync.setDate(lastSync.getDate() - 1); // overlap 1 day
            dateStart = lastSync.toISOString().split("T")[0];
          } else {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            dateStart = sevenDaysAgo.toISOString().split("T")[0];
          }
          const dateStop = now.toISOString().split("T")[0];

          // Mark as running
          await db.from("meta_sync_status").upsert(
            {
              meta_account_id: account.id,
              sync_type: "insights",
              last_sync_status: "running",
            } as any,
            { onConflict: "meta_account_id,sync_type" }
          );

          // Paginated fetch of ALL campaign insights for this account
          let totalInsights = 0;
          let cursor: string | undefined;

          do {
            let result;
            try {
              result = await metaAPI.getAccountInsights(
                account.meta_account_id,
                "campaign",
                dateStart,
                dateStop,
                500,
                cursor
              );
            } catch (err) {
              if (err instanceof RateLimitError) {
                // Rate limit hit — mark as partial, let Inngest retry
                await db.from("meta_sync_status").upsert(
                  {
                    meta_account_id: account.id,
                    sync_type: "insights",
                    last_sync_status: "partial",
                    last_error: `Rate limit at ${err.usage}%`,
                    records_synced: totalInsights,
                  } as any,
                  { onConflict: "meta_account_id,sync_type" }
                );
                throw err; // Inngest will retry
              }
              throw err;
            }

            const { insights, paging, rateLimitInfo } = result;

            if (insights.length > 0) {
              // Upsert into meta_insights
              const rows = insights.map((ins) => ({
                meta_account_id: account.id,
                object_id: ins.campaign_id || "",
                object_type: "campaign" as const,
                date_start: ins.date_start,
                date_stop: ins.date_stop,
                impressions: toInt(ins.impressions),
                clicks: toInt(ins.clicks),
                spend_micros: spendToMicros(ins.spend),
                cpc_micros: ins.cpc ? spendToMicros(ins.cpc) : null,
                cpm_micros: ins.cpm ? spendToMicros(ins.cpm) : null,
                ctr: toDecimal(ins.ctr),
                inline_link_clicks: toInt(ins.inline_link_clicks),
                landing_page_views: toInt(ins.landing_page_views),
                actions: ins.actions || null,
                action_values: ins.action_values || null,
                conversions: extractConversions(ins.actions),
                roas: calculateROAS(ins.spend, ins.action_values),
              }));

              // Batch upsert 100 at a time
              for (let i = 0; i < rows.length; i += 100) {
                const batch = rows.slice(i, i + 100);
                const { error } = await db
                  .from("meta_insights")
                  .upsert(batch as any, {
                    onConflict: "meta_account_id,object_id,object_type,date_start",
                  });

                if (error) {
                  console.error(`[sync-insights] Upsert error:`, error.message);
                }
              }

              totalInsights += insights.length;
            }

            cursor = paging?.cursors?.after;

            // Adaptive delay between pages
            if (cursor) {
              await adaptiveDelayFromInfo(rateLimitInfo);
            }
          } while (cursor);

          // Update aggregated metrics in meta_ads_campaigns
          await updateCampaignAggregates(account.id, dateStart, dateStop);

          // Mark as success
          await db.from("meta_sync_status").upsert(
            {
              meta_account_id: account.id,
              sync_type: "insights",
              last_synced_at: new Date().toISOString(),
              last_sync_status: "success",
              last_error: null,
              records_synced: totalInsights,
            } as any,
            { onConflict: "meta_account_id,sync_type" }
          );

          console.log(`[sync-insights] ${totalInsights} insights synced for ${account.meta_account_id}`);
        });
      } catch (err) {
        console.error(
          `[sync-insights] Error for ${account.meta_account_id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    return { success: true };
  }
);

/**
 * Extract total conversions from actions array.
 */
function extractConversions(
  actions: Array<{ action_type: string; value: string }> | undefined
): number {
  if (!actions) return 0;
  const purchase = actions.find(
    (a) =>
      a.action_type === "purchase" ||
      a.action_type === "offsite_conversion.fb_pixel_purchase"
  );
  return purchase ? parseInt(purchase.value, 10) || 0 : 0;
}

/**
 * Calculate ROAS from spend and action_values.
 */
function calculateROAS(
  spend: string | undefined,
  actionValues: Array<{ action_type: string; value: string }> | undefined
): number | null {
  if (!spend || !actionValues) return null;
  const spendNum = parseFloat(spend);
  if (!spendNum || spendNum === 0) return null;

  const purchaseValue = actionValues.find(
    (a) =>
      a.action_type === "purchase" ||
      a.action_type === "offsite_conversion.fb_pixel_purchase"
  );
  if (!purchaseValue) return null;

  const revenue = parseFloat(purchaseValue.value);
  return isNaN(revenue) ? null : parseFloat((revenue / spendNum).toFixed(4));
}

/**
 * Adaptive delay for sync context (reimplemented to avoid circular import).
 */
async function adaptiveDelayFromInfo(rateLimitInfo: RateLimitInfo): Promise<void> {
  const { maxUsage } = rateLimitInfo;
  const jitter = () => Math.random() * 1000;

  if (maxUsage < 50) return;
  if (maxUsage < 75) {
    await new Promise((r) => setTimeout(r, 1000 + jitter()));
    return;
  }
  if (maxUsage < 85) {
    await new Promise((r) => setTimeout(r, 3000 + jitter()));
    return;
  }
  if (maxUsage < 95) {
    await new Promise((r) => setTimeout(r, 10000 + jitter() * 2));
    return;
  }
  throw new RateLimitError(maxUsage);
}

/**
 * Update aggregated metrics in meta_ads_campaigns from meta_insights.
 * Sums all insights for each campaign and updates the denormalized columns.
 */
async function updateCampaignAggregates(
  dbAccountId: string,
  dateStart: string,
  dateStop: string
): Promise<void> {
  const db = getSupabase();

  // Get aggregated insights per campaign
  const { data } = await db
    .from("meta_insights")
    .select("object_id, impressions, clicks, spend_micros, cpc_micros, cpm_micros, ctr, conversions, roas")
    .eq("meta_account_id", dbAccountId)
    .eq("object_type", "campaign")
    .gte("date_start", dateStart)
    .lte("date_start", dateStop);

  const insights = (data || []) as Array<{
    object_id: string;
    impressions: number;
    clicks: number;
    spend_micros: number;
    cpc_micros: number | null;
    cpm_micros: number | null;
    ctr: number | null;
    conversions: number;
    roas: number | null;
  }>;

  if (insights.length === 0) return;

  // Group by campaign
  const campaignMetrics = new Map<string, {
    impressions: number;
    clicks: number;
    spend_micros: number;
    conversions: number;
  }>();

  for (const ins of insights) {
    const existing = campaignMetrics.get(ins.object_id) || {
      impressions: 0, clicks: 0, spend_micros: 0, conversions: 0,
    };
    existing.impressions += ins.impressions || 0;
    existing.clicks += ins.clicks || 0;
    existing.spend_micros += ins.spend_micros || 0;
    existing.conversions += ins.conversions || 0;
    campaignMetrics.set(ins.object_id, existing);
  }

  // Update each campaign
  for (const [campaignId, metrics] of campaignMetrics) {
    const cpc = metrics.clicks > 0 ? Math.round(metrics.spend_micros / metrics.clicks) : null;
    const cpm = metrics.impressions > 0 ? Math.round((metrics.spend_micros / metrics.impressions) * 1000) : null;
    const ctr = metrics.impressions > 0 ? parseFloat(((metrics.clicks / metrics.impressions) * 100).toFixed(4)) : null;

    await (db as any)
      .from("meta_ads_campaigns")
      .update({
        spend_micros: metrics.spend_micros,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        cpc_micros: cpc,
        cpm_micros: cpm,
        ctr,
        last_synced: new Date().toISOString(),
      })
      .eq("meta_account_id", dbAccountId)
      .eq("campaign_id", campaignId);
  }
}
