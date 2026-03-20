import { inngest } from "../client";
import { supabaseAdmin } from "@/lib/supabase";

function getSupabase() {
  if (!supabaseAdmin) throw new Error("supabaseAdmin not initialized");
  return supabaseAdmin;
}

const API_VERSION = process.env.META_API_VERSION || "v23.0";

export const refreshMetaToken = inngest.createFunction(
  { id: "refresh-meta-token", retries: 2 },
  { cron: "0 8 * * *" },
  async ({ step }) => {
    const connections = await step.run("fetch-connections", async () => {
      const { data, error } = await getSupabase()
        .from("meta_connections")
        .select("id, user_id, meta_access_token, meta_token_expires_at")
        .not("meta_access_token", "is", null)
        .eq("connection_status", "active");

      if (error) throw error;
      return data || [];
    });

    let refreshed = 0;
    let skipped = 0;
    let failed = 0;

    for (const conn of connections as any[]) {
      const daysUntilExpiry = conn.meta_token_expires_at
        ? Math.round(
            (new Date(conn.meta_token_expires_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      if (daysUntilExpiry > 7) {
        skipped++;
        continue;
      }

      await step.run(`refresh-token-${conn.id}`, async () => {
        console.log(
          `[RefreshToken] Refreshing token for user ${conn.user_id} (expires in ${daysUntilExpiry} days)`
        );

        const params = new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID || "",
          client_secret: process.env.META_APP_SECRET || "",
          fb_exchange_token: conn.meta_access_token,
        });

        const res = await fetch(
          `https://graph.facebook.com/${API_VERSION}/oauth/access_token?${params.toString()}`
        );
        const data = await res.json();

        if (data.error) {
          console.error(
            `[RefreshToken] Failed for user ${conn.user_id}:`,
            data.error.message
          );

          // Token is too expired to refresh — mark as expired
          await getSupabase()
            .from("meta_connections")
            .update({
              connection_status: "expired",
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", conn.id);

          failed++;
          return;
        }

        const expiresAt = new Date(
          Date.now() + (data.expires_in || 5184000) * 1000
        );

        await getSupabase()
          .from("meta_connections")
          .update({
            meta_access_token: data.access_token,
            meta_token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", conn.id);

        console.log(
          `[RefreshToken] Refreshed token for user ${conn.user_id}, new expiry: ${expiresAt.toISOString()}`
        );
        refreshed++;
      });
    }

    return {
      success: true,
      total: connections.length,
      refreshed,
      skipped,
      failed,
    };
  }
);
