import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

interface MetaAccount {
  id: string;
  user_id: string;
  account_id: string;
  account_name: string;
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

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export const useMetaAccounts = () => {
  return useQuery<MetaAccount[], Error>({
    queryKey: ['meta-accounts'],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('meta_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch accounts: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
};

export const useMetaAccountsKPIs = (accountId?: string) => {
  return useQuery<KPIMetrics, Error>({
    queryKey: ['meta-accounts-kpis', accountId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('meta_campaigns')
        .select('spend, impressions, clicks, cpc, roas, updated_at');

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch KPIs: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          totalSpend: 0,
          impressions: 0,
          clicks: 0,
          avgCpc: 0,
          avgRoas: 0,
        };
      }

      const metrics = data.reduce(
        (acc, campaign: any) => ({
          totalSpend: acc.totalSpend + (campaign.spend || 0),
          impressions: acc.impressions + (campaign.impressions || 0),
          clicks: acc.clicks + (campaign.clicks || 0),
          avgCpc: acc.avgCpc + (campaign.cpc || 0),
          avgRoas: acc.avgRoas + (campaign.roas || 0),
        }),
        { totalSpend: 0, impressions: 0, clicks: 0, avgCpc: 0, avgRoas: 0 }
      );

      return {
        ...metrics,
        avgCpc: metrics.avgCpc / data.length,
        avgRoas: metrics.avgRoas / data.length,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
};
