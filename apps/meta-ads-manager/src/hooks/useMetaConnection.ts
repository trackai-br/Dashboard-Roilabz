import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
 * Retorna o token de acesso do Supabase para enviar nas requisições autenticadas.
 */
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
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
      const token = await getAccessToken();
      if (!token) return null;

      const res = await fetch('/api/auth/meta/connection', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

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
      const token = await getAccessToken();
      if (!token) throw new Error('Não autenticado');

      const res = await fetch('/api/auth/meta/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
