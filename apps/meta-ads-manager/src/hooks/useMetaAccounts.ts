import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

export interface MetaAccount {
  id: string;
  meta_account_id: string;
  meta_account_name: string;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface KPIMetrics {
  totalSpend: number;
  impressions: number;
  clicks: number;
  avgCpc: number;
  avgRoas: number;
}

/**
 * Fetch Meta accounts from authenticated API endpoint
 * Uses /api/accounts which requires JWT Bearer token in Authorization header
 * Only returns accounts the authenticated user has access to
 */
export const useMetaAccounts = (): UseQueryResult<MetaAccount[], Error> => {
  return useQuery<MetaAccount[], Error>({
    queryKey: ['meta-accounts'],
    queryFn: async () => {
      // Get Supabase client to extract session token
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      // Get current session with access token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('No valid session - user must be logged in');
      }

      // Fetch with Authorization header containing JWT token
      const response = await fetch('/api/accounts', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
};

/**
 * Calculate KPIs from campaigns data
 * Fetches campaigns for the account and aggregates metrics
 * Returns aggregated spend, impressions, clicks, avg CPC and avg ROAS
 */
export const useMetaAccountsKPIs = (
  accountId?: string
): UseQueryResult<KPIMetrics, Error> => {
  return useQuery<KPIMetrics, Error>({
    queryKey: ['meta-accounts-kpis', accountId],
    queryFn: async () => {
      if (!accountId) {
        return {
          totalSpend: 0,
          impressions: 0,
          clicks: 0,
          avgCpc: 0,
          avgRoas: 0,
        };
      }

      const response = await fetch(`/api/meta/campaigns?accountId=${accountId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
      }

      const json = await response.json();
      const campaigns = json.campaigns || [];

      if (campaigns.length === 0) {
        return {
          totalSpend: 0,
          impressions: 0,
          clicks: 0,
          avgCpc: 0,
          avgRoas: 0,
        };
      }

      // Aggregate metrics from campaigns
      let totalSpend = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalCpc = 0;
      let totalRoas = 0;

      campaigns.forEach((campaign: any) => {
        if (campaign.metrics) {
          const spend = parseFloat(campaign.metrics.spend) || 0;
          const impressions = parseInt(campaign.metrics.impressions) || 0;
          const clicks = parseInt(campaign.metrics.clicks) || 0;
          const cpc = parseFloat(campaign.metrics.cpc) || 0;
          const roas = parseFloat(campaign.metrics.roas || campaign.roas) || 0;

          totalSpend += spend;
          totalImpressions += impressions;
          totalClicks += clicks;
          totalCpc += cpc;
          totalRoas += roas;
        }
      });

      return {
        totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        avgCpc: campaigns.length > 0 ? totalCpc / campaigns.length : 0,
        avgRoas: campaigns.length > 0 ? totalRoas / campaigns.length : 0,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    enabled: !!accountId, // Only run if accountId is provided
  });
};
