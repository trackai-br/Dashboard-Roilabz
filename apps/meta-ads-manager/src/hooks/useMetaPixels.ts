import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

export interface MetaPixel {
  id: string;
  name: string;
  last_fired_time?: number;
}

export function useMetaPixels(accountId?: string) {
  return useQuery({
    queryKey: ['metaPixels', accountId],
    queryFn: async () => {
      if (!accountId) return [];

      const res = await authenticatedFetch(`/api/meta/accounts/pixels?accountId=${accountId}`);
      if (!res.ok) throw new Error('Failed to fetch pixels');
      const data = await res.json();
      return data.pixels as MetaPixel[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
