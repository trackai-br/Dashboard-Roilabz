import { NextApiRequest } from "next";
import { supabase } from "./supabase";

/**
 * Extract and verify JWT token from request
 * Tries both Authorization header (API calls) and cookies (browser navigation)
 */
export async function getUserFromRequest(req: NextApiRequest) {
  // 1. Try Authorization header first (for API calls with Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        return data.user;
      }
    } catch (error) {
      console.error("Error verifying Authorization header token:", error);
    }
  }

  // 2. Try Supabase session cookie (for browser navigation)
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      data.session.access_token
    );

    if (userError || !userData.user) {
      return null;
    }

    return userData.user;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
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
