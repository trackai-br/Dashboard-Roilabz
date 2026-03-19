import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MetaPage {
  id: string;
  name: string;
  access_token?: string;
}

export function useMetaPages(accountId?: string) {
  return useQuery({
    queryKey: ['metaPages', accountId],
    queryFn: async () => {
      if (!accountId) return [];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];

      const res = await fetch(`/api/meta/accounts/pages?accountId=${accountId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch pages');
      const data = await res.json();
      return data.pages as MetaPage[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
