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
      // Fetch all ad accounts using Meta SDK
      const accounts = await step.run("fetch-meta-accounts", async () => {
        return await metaAPI.getAdAccounts();
      });

      let syncedAccounts = 0;
      let syncedCampaigns = 0;
      let syncedAdSets = 0;
      let syncedAds = 0;

      // Process each account
      for (const account of accounts) {
        try {
          // Sync account info
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

          // Get stored account ID for use in subsequent tables
          const { data: storedAccount, error: accountError } = await getSupabase()
            .from("meta_accounts")
            .select("id")
            .eq("meta_account_id", account.id)
            .single();

          if (accountError || !storedAccount) {
            console.error(`Could not fetch stored account for ${account.id}:`, accountError);
            continue;
          }

          const accountUUID = storedAccount.id;

          // Sync campaigns
          const campaignsResult = await step.run(`sync-campaigns-${account.id}`, async () => {
            return await metaAPI.getCampaigns(account.id);
          });

          for (const campaign of campaignsResult.campaigns) {
            await step.run(`sync-campaign-details-${campaign.id}`, async () => {
              const { error } = await getSupabase()
                .from("meta_ads_campaigns")
                .upsert(
                  {
                    meta_account_id: accountUUID,
                    campaign_id: campaign.id,
                    campaign_name: campaign.name,
                    status: campaign.status,
                    objective: campaign.objective,
                    daily_budget_micros: campaign.daily_budget,
                    budget_amount_micros: campaign.lifetime_budget,
                    start_time: campaign.start_time,
                    end_time: campaign.stop_time,
                    last_synced: new Date(),
                  } as any,
                  { onConflict: "meta_account_id,campaign_id" }
                );

              if (error) throw error;
              syncedCampaigns++;
            });

            // Sync ad sets for this campaign
            const adSetsResult = await step.run(`sync-adsets-${campaign.id}`, async () => {
              return await metaAPI.getAdSets(campaign.id);
            });

            for (const adset of adSetsResult.adsets) {
              await step.run(`sync-adset-details-${adset.id}`, async () => {
                const { error } = await getSupabase()
                  .from("meta_ad_sets")
                  .upsert(
                    {
                      meta_account_id: accountUUID,
                      campaign_id: campaign.id,
                      adset_id: adset.id,
                      name: adset.name,
                      status: adset.status,
                      daily_budget: adset.daily_budget,
                      lifetime_budget: adset.lifetime_budget,
                      targeting: adset.targeting,
                      billing_event: adset.billing_event,
                      bid_strategy: adset.bid_strategy,
                      bid_amount: adset.bid_amount,
                      last_synced: new Date(),
                    } as any,
                    { onConflict: "meta_account_id,adset_id" }
                  );

                if (error) throw error;
                syncedAdSets++;
              });

              // Sync ads for this ad set
              const adsResult = await step.run(`sync-ads-${adset.id}`, async () => {
                return await metaAPI.getAds(adset.id);
              });

              for (const ad of adsResult.ads) {
                await step.run(`sync-ad-details-${ad.id}`, async () => {
                  const { error } = await getSupabase()
                    .from("meta_ads")
                    .upsert(
                      {
                        meta_account_id: accountUUID,
                        adset_id: ad.adset_id,
                        ad_id: ad.id,
                        name: ad.name,
                        status: ad.status,
                        creative_id: ad.creative?.id,
                        creative_spec: ad.creative?.object_story_spec,
                        last_synced: new Date(),
                      } as any,
                      { onConflict: "meta_account_id,ad_id" }
                    );

                  if (error) throw error;
                  syncedAds++;
                });
              }
            }
          }
        } catch (accountError) {
          const message =
            accountError instanceof Error ? accountError.message : "Unknown error";
          console.error(`Error syncing account ${account.id}:`, message);
          // Continue with next account instead of failing entire job
        }
      }

      return {
        success: true,
        syncedAccounts,
        syncedCampaigns,
        syncedAdSets,
        syncedAds,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("401")) throw new Error("Invalid Meta token");
      if (message.includes("429")) throw new Error("Rate limited");
      throw error;
    }
  }
);
