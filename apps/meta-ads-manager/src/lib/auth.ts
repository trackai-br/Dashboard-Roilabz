import { NextApiRequest } from "next";
import { supabase } from "./supabase";

/**
 * Extract JWT token from Supabase session cookie
 * Works server-side by parsing cookies manually
 */
function getTokenFromCookie(req: NextApiRequest): string | null {
  const cookieHeader = req.headers.cookie || "";

  if (!cookieHeader) {
    console.log("[Auth] No cookies found in request");
    return null;
  }

  // Log all cookies for debugging
  console.log("[Auth] Available cookies:", cookieHeader.substring(0, 100) + "...");

  const cookies = cookieHeader.split(";").map(c => c.trim());

  // Look for any auth-related cookie
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");

    if (name.includes("auth") || name.includes("session")) {
      console.log(`[Auth] Found ${name} cookie, attempting to extract token...`);

      if (!value) continue;

      try {
        const decoded = decodeURIComponent(value);

        // Try parsing as JSON
        try {
          const jsonData = JSON.parse(decoded);
          if (jsonData.access_token) {
            console.log("[Auth] ✅ Extracted access_token from JSON cookie");
            return jsonData.access_token;
          }
          if (typeof jsonData === 'string') {
            console.log("[Auth] ✅ Using JSON string as token");
            return jsonData;
          }
        } catch (e) {
          // Not JSON, try as plain token
        }

        // If it looks like a JWT token (has dots), use it directly
        if (decoded.includes(".") && decoded.split(".").length === 3) {
          console.log("[Auth] ✅ Using decoded cookie as JWT token");
          return decoded;
        }
      } catch (e) {
        console.error(`[Auth] Error processing ${name} cookie:`, e);
      }
    }
  }

  console.log("[Auth] ❌ No valid auth token found in cookies");
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
