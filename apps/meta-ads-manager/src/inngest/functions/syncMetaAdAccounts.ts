import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";

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
      const response = await step.run("fetch-meta-accounts", async () => {
        const res = await fetch(
          "https://graph.facebook.com/v23.0/me/adaccounts",
          {
            headers: {
              Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
            },
          }
        );
        if (!res.ok) throw new Error(`Meta API: ${res.statusText}`);
        return res.json();
      });

      let synced = 0;
      for (const account of response.data || []) {
        await step.run(`sync-account-${account.id}`, async () => {
          const { id: meta_account_id, name, currency, timezone } = account;

          const { error } = await getSupabase()
            .from("meta_accounts")
            .upsert(
              {
                meta_account_id,
                meta_account_name: name,
                currency,
                timezone,
                last_synced: new Date(),
              } as any,
              { onConflict: "meta_account_id" }
            );

          if (error) throw error;
          synced++;
        });
      }

      return { success: true, synced };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("401")) throw new Error("Invalid Meta token");
      if (message.includes("429")) throw new Error("Rate limited");
      throw error;
    }
  }
);
