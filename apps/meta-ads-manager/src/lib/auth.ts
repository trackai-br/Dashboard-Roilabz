import { NextApiRequest } from "next";
import { supabase } from "./supabase";

/**
 * Extract and verify JWT token from request
 */
export async function getUserFromRequest(req: NextApiRequest) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

/**
 * Check if user is authenticated, throw error if not
 */
export async function requireAuth(req: NextApiRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
