import { NextApiRequest } from "next";
import { supabaseAdmin } from "./supabase";

/**
 * Extract and verify JWT token from request.
 * Uses supabaseAdmin (service_role) for server-side token validation.
 */
export async function getUserFromRequest(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { data, error } = await supabaseAdmin!.auth.getUser(token);
      if (!error && data.user) {
        return data.user;
      }
    } catch (error) {
      console.error("[Auth] Error verifying token:", error);
    }
  }

  return null;
}

/**
 * Check if user is authenticated, return {user, error} tuple
 */
export async function requireAuth(req: NextApiRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return { user: null, error: "Unauthorized" };
    }

    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : "Authentication failed"
    };
  }
}
