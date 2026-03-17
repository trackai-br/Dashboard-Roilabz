import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

export interface Campaign {
  id: string;
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

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export const useMetaCampaigns = (
  options: UseMetaCampaignsOptions = {}
): UseQueryResult<Campaign[], Error> => {
  const { accountId, limit = 50, offset = 0 } = options;

  return useQuery<Campaign[], Error>({
    queryKey: ['meta-campaigns', accountId, limit, offset],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('meta_campaigns')
        .select(
          `id,
           name,
           account_id,
           status,
           spend,
           impressions,
           clicks,
           cpc,
           roas,
           updated_at,
           meta_accounts(account_name)`
        )
        .order('updated_at', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch campaigns: ${error.message}`);
      }

      // Map data to include account_name from the join
      const campaigns = (data || []).map((campaign: any) => ({
        ...campaign,
        account_name: campaign.meta_accounts?.account_name,
      }));

      return campaigns;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
};

export const useMetaCampaignStats = () => {
  return useQuery<
    {
      total: number;
      active: number;
      paused: number;
      archived: number;
    },
    Error
  >({
    queryKey: ['meta-campaigns-stats'],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('meta_campaigns')
        .select('status');

      if (error) {
        throw new Error(`Failed to fetch campaign stats: ${error.message}`);
      }

      const campaigns = data || [];
      return {
        total: campaigns.length,
        active: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
        paused: campaigns.filter((c: any) => c.status === 'PAUSED').length,
        archived: campaigns.filter((c: any) => c.status === 'ARCHIVED').length,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
};
