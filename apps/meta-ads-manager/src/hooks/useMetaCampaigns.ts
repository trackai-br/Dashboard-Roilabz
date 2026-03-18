import { useQuery, UseQueryResult } from '@tanstack/react-query';

export interface Campaign {
  id: string;
  campaign_id: string;
  name: string;
  account_id: string;
  account_name?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  roas: number;
  updated_at: string;
}

interface UseMetaCampaignsOptions {
  accountId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch campaigns from authenticated API endpoint
 * Uses /api/meta/campaigns which fetches from DB + enriches with Meta API metrics
 * Only returns campaigns for the specified accountId
 */
export const useMetaCampaigns = (
  options: UseMetaCampaignsOptions = {}
): UseQueryResult<Campaign[], Error> => {
  const { accountId, limit = 50, offset = 0 } = options;

  return useQuery<Campaign[], Error>({
    queryKey: ['meta-campaigns', accountId, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (accountId) {
        params.append('accountId', accountId);
      }
      if (limit) {
        params.append('limit', limit.toString());
      }
      if (offset) {
        params.append('offset', offset.toString());
      }

      const response = await fetch(`/api/meta/campaigns?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
      }

      const json = await response.json();
      const campaigns = json.campaigns || [];

      // Transform API response to Campaign interface
      // Metrics come as strings from API, need to parse to numbers
      return campaigns.map((campaign: any) => ({
        id: campaign.id,
        campaign_id: campaign.campaign_id,
        name: campaign.campaign_name,
        account_id: campaign.meta_account_id || '',
        account_name: campaign.account_name,
        status: campaign.status || 'PAUSED',
        spend: campaign.metrics?.spend ? parseFloat(campaign.metrics.spend) : 0,
        impressions: campaign.metrics?.impressions ? parseInt(campaign.metrics.impressions) : 0,
        clicks: campaign.metrics?.clicks ? parseInt(campaign.metrics.clicks) : 0,
        cpc: campaign.metrics?.cpc ? parseFloat(campaign.metrics.cpc) : 0,
        roas: campaign.roas ? parseFloat(campaign.roas) : 0,
        updated_at: campaign.updated_at,
      }));
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    enabled: !!accountId, // Only run if accountId is provided
  });
};

/**
 * Get campaign statistics (total, active, paused, archived counts)
 */
export const useMetaCampaignStats = (accountId?: string) => {
  return useQuery<
    {
      total: number;
      active: number;
      paused: number;
      archived: number;
    },
    Error
  >({
    queryKey: ['meta-campaigns-stats', accountId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (accountId) {
        params.append('accountId', accountId);
      }

      const response = await fetch(`/api/meta/campaigns?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch campaign stats: ${response.statusText}`);
      }

      const json = await response.json();
      const campaigns = json.campaigns || [];

      return {
        total: campaigns.length,
        active: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
        paused: campaigns.filter((c: any) => c.status === 'PAUSED').length,
        archived: campaigns.filter((c: any) => c.status === 'ARCHIVED').length,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    enabled: !!accountId,
  });
};
