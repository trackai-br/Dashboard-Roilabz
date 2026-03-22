import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

export interface MetaConnection {
  id: string;
  user_id: string;
  meta_user_id: string;
  meta_user_name: string;
  meta_access_token: string;
  meta_token_expires_at: string | null;
  meta_scopes: string;
  connection_status: 'active' | 'revoked' | 'expired';
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

/**
 * Hook para gerenciar conexão com Meta/Facebook
 */
export const useMetaConnection = () => {
  const queryClient = useQueryClient();

  const {
    data: connection,
    isLoading: isLoadingConnection,
    error: connectionError,
    refetch: refetchConnection,
  } = useQuery<MetaConnection | null>({
    queryKey: ['meta-connection'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/auth/meta/connection');

      if (!res.ok) {
        if (res.status === 404) return null;
        if (res.status === 401) return null;
        throw new Error('Falha ao buscar conexão Meta');
      }
      return res.json();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await authenticatedFetch('/api/auth/meta/disconnect', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Falha ao desconectar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['meta-connection'], null);
      queryClient.invalidateQueries({ queryKey: ['meta-connection'] });
    },
  });

  return {
    connection,
    isLoadingConnection,
    connectionError,
    refetchConnection,
    disconnectMutation,
  };
};
