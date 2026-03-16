import { inngest } from "@/inngest/client";
import { syncMetaAdAccounts } from "@/inngest/functions/syncMetaAdAccounts";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return inngest.serve({
    client: inngest,
    functions: [syncMetaAdAccounts],
  })(req, res);
}
