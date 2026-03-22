import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

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
      const response = await authenticatedFetch('/api/logs/sync');

      if (!response.ok) throw new Error('Failed to fetch logs');
      const json = await response.json();
      return (json.logs || []) as SyncLog[];
    },
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
  });
};
