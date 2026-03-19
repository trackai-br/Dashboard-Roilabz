import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
 * Busca dados de conexão e oferece mutações para reconectar/desconectar
 */
export const useMetaConnection = () => {
  const queryClient = useQueryClient();

  // Buscar dados de conexão
  const {
    data: connection,
    isLoading: isLoadingConnection,
    error: connectionError,
    refetch: refetchConnection,
  } = useQuery<MetaConnection | null>({
    queryKey: ['meta-connection'],
    queryFn: async () => {
      const res = await fetch('/api/auth/meta/connection');
      if (!res.ok) {
        // 404 = não conectado, outros erros = exceção
        if (res.status === 404) return null;
        throw new Error('Failed to fetch Meta connection');
      }
      return res.json();
    },
  });

  // Desconectar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/meta/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to disconnect');
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
