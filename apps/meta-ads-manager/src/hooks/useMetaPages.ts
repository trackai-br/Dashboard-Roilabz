import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

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

      const res = await authenticatedFetch(`/api/meta/accounts/pages?accountId=${accountId}`);
      if (!res.ok) throw new Error('Failed to fetch pages');
      const data = await res.json();
      return data.pages as MetaPage[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
