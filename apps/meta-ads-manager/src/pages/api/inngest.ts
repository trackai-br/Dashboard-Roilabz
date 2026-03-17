import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { syncMetaAdAccounts } from "@/inngest/functions/syncMetaAdAccounts";
import { syncGoogleAdsAccounts } from "@/inngest/functions/syncGoogleAdsAccounts";

export default serve({
  client: inngest,
  functions: [syncMetaAdAccounts, syncGoogleAdsAccounts],
});
