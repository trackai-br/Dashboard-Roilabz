import type { NextApiRequest, NextApiResponse } from "next";
import { getUserAccounts, logAccess } from "@/lib/supabase-rls";
import { requireAuth } from "@/lib/auth";
import type { ApiResponse, MetaAccount } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<MetaAccount[]>>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: { message: "Method not allowed" },
    });
  }

  try {
    const { user, error: authError } = await requireAuth(req);

    if (authError || !user) {
      return res.status(401).json({
        error: { message: "Unauthorized" },
      });
    }

    // Log access
    await logAccess({
      userId: user.id,
      accountId: "", // No specific account for this list operation
      action: "LIST_ACCOUNTS",
      resourceType: "accounts",
      status: "success",
    }).catch((error) => {
      // Log errors but don't fail the request
      console.error("Failed to log access:", error);
    });

    // Get accounts the user has access to (RLS enforced)
    const accounts = await getUserAccounts(user.id);

    return res.status(200).json({
      data: accounts,
    });
  } catch (error) {
    console.error("Error in GET /accounts:", error);
    return res.status(500).json({
      error: { message: "Internal server error" },
    });
  }
}
