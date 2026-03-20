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

      // Process each account — sync account info only
      // (meta_ad_sets, meta_ads tables do not exist yet; campaigns sync is handled separately)
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
