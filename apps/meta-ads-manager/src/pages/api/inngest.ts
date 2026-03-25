import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { syncMetaAdAccounts } from "@/inngest/functions/syncMetaAdAccounts";
import { syncGoogleAdsAccounts } from "@/inngest/functions/syncGoogleAdsAccounts";
import { refreshMetaToken } from "@/inngest/functions/refreshMetaToken";
import { syncMetaInsights } from "@/inngest/functions/syncMetaInsights";
import { bulkCreateCampaigns } from "@/inngest/functions/bulkCreateCampaigns";
import { checkAlertRules } from "@/inngest/functions/checkAlertRules";

export default serve({
  client: inngest,
  functions: [
    syncMetaAdAccounts,
    syncGoogleAdsAccounts,
    refreshMetaToken,
    syncMetaInsights,
    bulkCreateCampaigns,
    checkAlertRules,
  ],
});
