import { useQuery } from '@tanstack/react-query';

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

      const res = await fetch(`/api/meta/accounts/pixels?accountId=${accountId}`);
      if (!res.ok) throw new Error('Failed to fetch pixels');
      const data = await res.json();
      return data.pixels as MetaPixel[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
