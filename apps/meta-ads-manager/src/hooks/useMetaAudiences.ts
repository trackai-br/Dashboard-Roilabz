import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

export interface MetaAudience {
  id: string;
  name: string;
  approximate_count: number;
  subtype: string;
}

export function useMetaAudiences(accountId?: string) {
  return useQuery({
    queryKey: ['metaAudiences', accountId],
    queryFn: async () => {
      if (!accountId) return [];

      const res = await authenticatedFetch(
        `/api/meta/accounts/audiences?accountId=${accountId}`
      );
      if (!res.ok) throw new Error('Failed to fetch audiences');
      const data = await res.json();
      return data.audiences as MetaAudience[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
