// @ts-nocheck - Supabase client typing doesn't fully support custom tables
import { supabase, supabaseAdmin } from "./supabase";

// Helper to ensure supabaseAdmin is available
function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized - missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

/**
 * Get all accounts accessible by the authenticated user
 */
export async function getUserAccounts(userId: string) {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("user_account_access")
    .select("account_id, access_level")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user accounts:", error);
    throw error;
  }

  const accountIds = data.map((access) => access.account_id);

  if (accountIds.length === 0) {
    return [];
  }

  const { data: accounts, error: accountsError } = await admin
    .from("meta_accounts")
    .select("*")
    .in("id", accountIds);

  if (accountsError) {
    console.error("Error fetching account details:", accountsError);
    throw accountsError;
  }

  return accounts || [];
}

/**
 * Check if user has access to a specific account
 */
export async function hasAccountAccess(
  userId: string,
  accountId: string,
  minAccessLevel: "viewer" | "editor" | "admin" = "viewer"
): Promise<boolean> {
  const accessLevels = {
    viewer: ["viewer", "editor", "admin"],
    editor: ["editor", "admin"],
    admin: ["admin"],
  };

  const { data, error } = await getAdminClient()
    .from("user_account_access")
    .select("access_level")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false; // No row found
    }
    console.error("Error checking account access:", error);
    throw error;
  }

  if (!data) {
    return false;
  }

  return accessLevels[minAccessLevel].includes(data.access_level);
}

/**
 * Log access action for audit trail
 */
export async function logAccess(params: {
  userId: string;
  accountId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  status?: "success" | "denied" | "error";
  details?: Record<string, any>;
}) {
  const { userId, accountId, action, resourceType, resourceId, status = "success", details } = params;

  const { error } = await getAdminClient()
    .from("access_logs")
    .insert({
      user_id: userId,
      account_id: accountId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      status,
      details: details || null,
    });

  if (error) {
    console.error("Error logging access:", error);
    throw error;
  }
}

/**
 * Grant account access to a user
 */
export async function grantAccountAccess(
  userId: string,
  accountId: string,
  accessLevel: "viewer" | "editor" | "admin"
) {
  const { data, error } = await getAdminClient()
    .from("user_account_access")
    .upsert({
      user_id: userId,
      account_id: accountId,
      access_level: accessLevel,
    })
    .select();

  if (error) {
    console.error("Error granting account access:", error);
    throw error;
  }

  return data?.[0];
}

/**
 * Revoke account access from a user
 */
export async function revokeAccountAccess(userId: string, accountId: string) {
  const { error } = await getAdminClient()
    .from("user_account_access")
    .delete()
    .eq("user_id", userId)
    .eq("account_id", accountId);

  if (error) {
    console.error("Error revoking account access:", error);
    throw error;
  }
}

/**
 * Get access logs for an account
 */
export async function getAccessLogs(accountId: string, limit = 100) {
  const { data, error } = await getAdminClient()
    .from("access_logs")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching access logs:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create or update user
 */
export async function upsertUser(userId: string, email: string, role: "user" | "admin" = "user") {
  const { data, error } = await getAdminClient()
    .from("users")
    .upsert({
      id: userId,
      email,
      role,
    })
    .select();

  if (error) {
    console.error("Error upserting user:", error);
    throw error;
  }

  return data?.[0];
}

/**
 * Get user details
 */
export async function getUser(userId: string) {
  const { data, error } = await getAdminClient()
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user:", error);
    throw error;
  }

  return data;
}
