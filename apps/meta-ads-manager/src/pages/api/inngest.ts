import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { syncMetaAdAccounts } from "@/inngest/functions/syncMetaAdAccounts";
import { syncGoogleAdsAccounts } from "@/inngest/functions/syncGoogleAdsAccounts";
import { refreshMetaToken } from "@/inngest/functions/refreshMetaToken";

export default serve({
  client: inngest,
  functions: [syncMetaAdAccounts, syncGoogleAdsAccounts, refreshMetaToken],
});
