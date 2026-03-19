import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];

      const res = await fetch(`/api/meta/accounts/pixels?accountId=${accountId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch pixels');
      const data = await res.json();
      return data.pixels as MetaPixel[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
