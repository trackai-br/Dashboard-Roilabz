import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase admin client not initialized" });
    }

    // Use supabaseAdmin to bypass RLS (service role)
    const { data: userAccounts, error } = await supabaseAdmin
      .from("user_account_access")
      .select("account_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("[accounts] Error fetching user_account_access:", error);
      return res.status(500).json({ error: "Failed to fetch user accounts" });
    }

    const accountIds = userAccounts?.map((ua: any) => ua.account_id) || [];

    if (accountIds.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("meta_accounts")
      .select("*")
      .in("id", accountIds);

    if (accountsError) {
      console.error("[accounts] Error fetching meta_accounts:", accountsError);
      return res.status(500).json({ error: "Failed to fetch account details" });
    }

    return res.status(200).json({ data: accounts || [] });
  } catch (error) {
    console.error("Error in GET /accounts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
