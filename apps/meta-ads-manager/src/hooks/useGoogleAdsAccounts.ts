import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface GoogleAdsAccount {
  id: string;
  user_id: string;
  google_customer_id: string;
  account_name: string;
  currency_code: string | null;
  time_zone: string | null;
  last_synced: string | null;
  created_at: string;
}

interface UseGoogleAdsAccountsReturn {
  accounts: GoogleAdsAccount[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGoogleAdsAccounts(): UseGoogleAdsAccountsReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('google_ads_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAccounts(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch accounts';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchAccounts();
    }
  }, [user, authLoading, fetchAccounts]);

  return {
    accounts,
    isLoading: authLoading || isLoading,
    error,
    refetch: fetchAccounts,
  };
}
