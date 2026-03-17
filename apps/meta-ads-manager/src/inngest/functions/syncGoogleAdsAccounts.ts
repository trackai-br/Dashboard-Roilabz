import { inngest } from '../client';
import { createClient } from '@supabase/supabase-js';

interface GoogleUser {
  id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
}

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabase;
}

// This is a mock sync function that would normally use the Google Ads API
// In production, you would use the google-ads-api package to fetch real data
async function fetchGoogleAdsAccountsForUser(userId: string, token: string) {
  try {
    // Mock data - in production, this would call the Google Ads API
    // const response = await googleAdsService.getCustomers(token);
    // For now, return empty array as Google Ads API requires complex setup

    return [];
  } catch (error) {
    throw new Error(
      `Failed to fetch Google Ads accounts: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function fetchGoogleAdsCampaignsForAccount(
  token: string,
  customerId: string
) {
  try {
    // Mock data - in production, this would call the Google Ads API
    // const response = await googleAdsService.getCampaigns(token, customerId);

    return [];
  } catch (error) {
    throw new Error(
      `Failed to fetch campaigns: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export const syncGoogleAdsAccounts = inngest.createFunction(
  { id: 'sync-google-ads-accounts', retries: 3 },
  { cron: '*/15 * * * *' },
  async ({ event, step }) => {
    try {
      // Get all users with Google OAuth connected
      const { data: users, error: usersError } = await step.run(
        'fetch-users-with-google',
        async () => {
          return await getSupabase()
            .from('users')
            .select('id, google_access_token, google_refresh_token')
            .eq('provider', 'google')
            .not('google_access_token', 'is', null);
        }
      );

      if (usersError) throw usersError;
      if (!users || users.length === 0) return { synced: 0, campaigns: 0 };

      const typedUsers = (users as (GoogleUser | null)[]).filter(
        (u): u is GoogleUser => u !== null
      );
      let totalSynced = 0;
      let totalCampaigns = 0;

      for (const user of typedUsers) {
        await step.run(`sync-user-${user.id}`, async () => {
          try {
            if (!user.google_access_token) return;

            // Fetch user's Google Ads accounts
            const accounts = await fetchGoogleAdsAccountsForUser(
              user.id,
              user.google_access_token
            );

            for (const account of accounts) {
              await step.run(
                `sync-account-${user.id}-${account.customerId}`,
                async () => {
                  // Upsert account
                  const { error: accountError } = await supabase
                    .from('google_ads_accounts')
                    .upsert(
                      {
                        user_id: user.id,
                        google_customer_id: account.customerId,
                        account_name: account.descriptiveName,
                        currency_code: account.currencyCode,
                        time_zone: account.timeZone,
                        last_synced: new Date(),
                      },
                      { onConflict: 'user_id, google_customer_id' }
                    );

                  if (accountError) throw accountError;

                  // Fetch campaigns for this account
                  const campaigns = await fetchGoogleAdsCampaignsForAccount(
                    user.google_access_token!,
                    account.customerId
                  );

                  // Get account ID for campaigns
                  const { data: accountData, error: accountQueryError } =
                    await supabase
                      .from('google_ads_accounts')
                      .select('id')
                      .eq('user_id', user.id)
                      .eq('google_customer_id', account.customerId)
                      .single();

                  if (accountQueryError) throw accountQueryError;

                  // Upsert campaigns
                  for (const campaign of campaigns) {
                    const { error: campaignError } = await supabase
                      .from('google_ads_campaigns')
                      .upsert(
                        {
                          account_id: accountData.id,
                          google_campaign_id: campaign.id,
                          campaign_name: campaign.name,
                          campaign_status: campaign.status,
                          campaign_type: campaign.advertisingChannelType,
                          status: campaign.status,
                          budget_amount_micros: campaign.budgetAmountMicros,
                          spend_micros: campaign.spendMicros || 0,
                          impressions: campaign.impressions || 0,
                          clicks: campaign.clicks || 0,
                          average_cpc_micros: campaign.averageCpcMicros || 0,
                          cost_micros: campaign.costMicros || 0,
                          last_synced: new Date(),
                        },
                        { onConflict: 'account_id, google_campaign_id' }
                      );

                    if (campaignError) throw campaignError;
                    totalCampaigns++;
                  }

                  totalSynced++;
                }
              );
            }
          } catch (userError) {
            console.error(`Error syncing user ${user.id}:`, userError);
            throw userError;
          }
        });
      }

      return {
        success: true,
        accountsSynced: totalSynced,
        campaignsSynced: totalCampaigns,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('401')) throw new Error('Invalid Google token');
      if (message.includes('429')) throw new Error('Rate limited');
      throw error;
    }
  }
);
