import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";
import { metaAPI } from "@/lib/meta-api";

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

export const syncMetaAdAccounts = inngest.createFunction(
  { id: "sync-meta-ad-accounts", retries: 3 },
  { cron: "*/15 * * * *" },
  async ({ event, step }) => {
    try {
      // Step 1: Fetch all ad accounts from Meta
      const accounts = await step.run("fetch-meta-accounts", async () => {
        return await metaAPI.getAdAccounts();
      });

      let syncedAccounts = 0;

      // Step 2: Sync each account metadata
      for (const account of accounts) {
        try {
          await step.run(`sync-account-${account.id}`, async () => {
            const { error } = await getSupabase()
              .from("meta_accounts")
              .upsert(
                {
                  meta_account_id: account.id,
                  meta_account_name: account.name,
                  currency: account.currency,
                  timezone: account.timezone,
                  last_synced: new Date(),
                } as any,
                { onConflict: "meta_account_id" }
              );

            if (error) throw error;
            syncedAccounts++;
          });
        } catch (accountError) {
          const message =
            accountError instanceof Error ? accountError.message : "Unknown error";
          console.error(`Error syncing account ${account.id}:`, message);
        }
      }

      // Step 3: Sync campaigns for each account
      for (const account of accounts) {
        try {
          await step.run(`sync-campaigns-${account.id}`, async () => {
            const db = getSupabase();

            // Get internal UUID for this account
            const { data: dbAccount } = await db
              .from("meta_accounts")
              .select("id")
              .eq("meta_account_id", account.id)
              .single() as { data: { id: string } | null };

            if (!dbAccount) return;

            const campaigns = await metaAPI.getAllCampaigns(account.id);
            if (campaigns.length === 0) return;

            // Batch upsert campaigns (100 at a time)
            for (let i = 0; i < campaigns.length; i += 100) {
              const batch = campaigns.slice(i, i + 100).map((c) => ({
                meta_account_id: dbAccount.id,
                campaign_id: c.id,
                campaign_name: c.name,
                status: c.effective_status || c.status,
                objective: c.objective,
                daily_budget_micros: c.daily_budget ? parseInt(String(c.daily_budget)) : null,
                budget_amount_micros: c.lifetime_budget ? parseInt(String(c.lifetime_budget)) : null,
                start_time: c.start_time || null,
                end_time: c.stop_time || null,
                last_synced: new Date().toISOString(),
              }));

              const { error } = await db
                .from("meta_ads_campaigns")
                .upsert(batch as any, { onConflict: "meta_account_id,campaign_id" });

              if (error) console.error(`Error upserting campaigns batch:`, error.message);
            }

            // Update sync status
            await db.from("meta_sync_status").upsert(
              {
                meta_account_id: dbAccount.id,
                sync_type: "campaigns",
                last_synced_at: new Date().toISOString(),
                last_sync_status: "success",
                records_synced: campaigns.length,
              } as any,
              { onConflict: "meta_account_id,sync_type" }
            );

            console.log(`[sync] ${campaigns.length} campaigns synced for ${account.id}`);
          });
        } catch (err) {
          console.error(`Error syncing campaigns for ${account.id}:`, err instanceof Error ? err.message : err);
        }
      }

      // Step 4: Sync ad sets for each account
      for (const account of accounts) {
        try {
          await step.run(`sync-adsets-${account.id}`, async () => {
            const db = getSupabase();

            const { data: dbAccount } = await db
              .from("meta_accounts")
              .select("id")
              .eq("meta_account_id", account.id)
              .single() as { data: { id: string } | null };

            if (!dbAccount) return;

            const adsets = await metaAPI.getAllAdSets(account.id);
            if (adsets.length === 0) return;

            for (let i = 0; i < adsets.length; i += 100) {
              const batch = adsets.slice(i, i + 100).map((as) => ({
                meta_account_id: dbAccount.id,
                campaign_id: as.campaign_id,
                adset_id: as.id,
                name: as.name,
                status: as.status,
                daily_budget: as.daily_budget ? parseInt(String(as.daily_budget)) : null,
                lifetime_budget: as.lifetime_budget ? parseInt(String(as.lifetime_budget)) : null,
                targeting: as.targeting || null,
                billing_event: as.billing_event || null,
                bid_strategy: as.bid_strategy || null,
                bid_amount: as.bid_amount ? parseInt(String(as.bid_amount)) : null,
                last_synced: new Date().toISOString(),
              }));

              const { error } = await db
                .from("meta_ad_sets")
                .upsert(batch as any, { onConflict: "meta_account_id,adset_id" });

              if (error) console.error(`Error upserting adsets batch:`, error.message);
            }

            await db.from("meta_sync_status").upsert(
              {
                meta_account_id: dbAccount.id,
                sync_type: "adsets",
                last_synced_at: new Date().toISOString(),
                last_sync_status: "success",
                records_synced: adsets.length,
              } as any,
              { onConflict: "meta_account_id,sync_type" }
            );

            console.log(`[sync] ${adsets.length} adsets synced for ${account.id}`);
          });
        } catch (err) {
          console.error(`Error syncing adsets for ${account.id}:`, err instanceof Error ? err.message : err);
        }
      }

      // Step 5: Sync ads for each account
      for (const account of accounts) {
        try {
          await step.run(`sync-ads-${account.id}`, async () => {
            const db = getSupabase();

            const { data: dbAccount } = await db
              .from("meta_accounts")
              .select("id")
              .eq("meta_account_id", account.id)
              .single() as { data: { id: string } | null };

            if (!dbAccount) return;

            const ads = await metaAPI.getAllAds(account.id);
            if (ads.length === 0) return;

            for (let i = 0; i < ads.length; i += 100) {
              const batch = ads.slice(i, i + 100).map((ad) => ({
                meta_account_id: dbAccount.id,
                adset_id: ad.adset_id,
                ad_id: ad.id,
                name: ad.name,
                status: ad.status,
                creative_id: ad.creative?.id || null,
                creative_spec: ad.creative?.object_story_spec || null,
                last_synced: new Date().toISOString(),
              }));

              const { error } = await db
                .from("meta_ads")
                .upsert(batch as any, { onConflict: "meta_account_id,ad_id" });

              if (error) console.error(`Error upserting ads batch:`, error.message);
            }

            await db.from("meta_sync_status").upsert(
              {
                meta_account_id: dbAccount.id,
                sync_type: "ads",
                last_synced_at: new Date().toISOString(),
                last_sync_status: "success",
                records_synced: ads.length,
              } as any,
              { onConflict: "meta_account_id,sync_type" }
            );

            console.log(`[sync] ${ads.length} ads synced for ${account.id}`);
          });
        } catch (err) {
          console.error(`Error syncing ads for ${account.id}:`, err instanceof Error ? err.message : err);
        }
      }

      return {
        success: true,
        syncedAccounts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("401")) throw new Error("Invalid Meta token");
      if (message.includes("429")) throw new Error("Rate limited");
      throw error;
    }
  }
);
