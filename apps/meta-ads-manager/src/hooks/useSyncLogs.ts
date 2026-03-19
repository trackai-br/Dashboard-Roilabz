import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

export interface SyncLog {
  id: string;
  user_id: string;
  status: 'success' | 'partial' | 'failed';
  synced_accounts: number;
  synced_pages: number;
  synced_pixels: number;
  error_details: Record<string, unknown> | null;
  created_at: string;
}

export const useSyncLogs = () => {
  return useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch('/api/logs/sync', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch logs');
      const json = await response.json();
      return (json.logs || []) as SyncLog[];
    },
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
  });
};
