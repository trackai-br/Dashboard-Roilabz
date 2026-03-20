import { NextApiRequest } from "next";
import { supabase } from "./supabase";

/**
 * Extract JWT token from Supabase session cookie
 * Works server-side by parsing cookies manually
 */
function getTokenFromCookie(req: NextApiRequest): string | null {
  const cookieHeader = req.headers.cookie || "";

  // Look for sb-<project-id>-auth-token cookie
  const cookies = cookieHeader.split(";").map(c => c.trim());

  for (const cookie of cookies) {
    if (cookie.includes("auth-token")) {
      try {
        const [, value] = cookie.split("=");
        if (value) {
          // Cookie value is JSON-encoded
          const decoded = JSON.parse(decodeURIComponent(value));
          return decoded.access_token || decoded;
        }
      } catch (e) {
        // Try as plain token
        const [, value] = cookie.split("=");
        if (value) return decodeURIComponent(value);
      }
    }
  }

  return null;
}

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

  // 2. Try Supabase session cookie (for browser navigation - server-side)
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      return null;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

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
