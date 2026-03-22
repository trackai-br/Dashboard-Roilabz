import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

export interface SyncStatus {
  id?: string;
  synced_accounts: number;
  synced_pages: number;
  synced_pixels: number;
  status: 'success' | 'partial' | 'failed';
  timestamp?: string;
  created_at?: string;
}

export const useMetaSync = () => {
  const queryClient = useQueryClient();

  const { data: syncLog, isLoading: logLoading } = useQuery({
    queryKey: ['sync-log'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/logs/sync');

      if (!response.ok) return null;
      const json = await response.json();
      const logs = (json.logs || []) as SyncStatus[];
      return logs.length > 0 ? logs[0] : null;
    },
    refetchInterval: 60 * 60 * 1000, // 1 hour
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch('/api/meta/sync-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-log'] });
      queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['metaPages'] });
      queryClient.invalidateQueries({ queryKey: ['metaPixels'] });
    },
  });

  const getSyncStatus = (): 'idle' | 'syncing' | 'success' | 'error' => {
    if (syncMutation.isPending) return 'syncing';
    if (syncMutation.isSuccess) return 'success';
    if (syncMutation.error) return 'error';
    return 'idle';
  };

  return {
    syncLog,
    lastSync: syncLog?.created_at ?? syncLog?.timestamp ?? null,
    syncStatus: getSyncStatus(),
    isLoading: logLoading,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncAll: syncMutation.mutate,
    error: syncMutation.error,
  };
};
