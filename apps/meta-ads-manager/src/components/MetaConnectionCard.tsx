'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMetaConnection } from '@/hooks/useMetaConnection';

/**
 * Componente de conexão com Meta/Facebook
 * Mostra dois estados: Conectado ou Não Conectado
 * Inclui toasts de sucesso/erro
 */
export const MetaConnectionCard: React.FC = () => {
  const router = useRouter();
  const { connection, isLoadingConnection, disconnectMutation } = useMetaConnection();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verificar query params para mostrar mensagens
  useEffect(() => {
    if (router.query.connected === 'true') {
      setMessage({
        type: 'success',
        text: '✅ Facebook conectado com sucesso!',
      });
      setTimeout(() => setMessage(null), 5000);
      // Limpar query param
      router.replace('/settings', undefined, { shallow: true });
    }

    if (router.query.error) {
      const errorMap: Record<string, string> = {
        csrf: '❌ Erro de segurança (CSRF). Tente novamente.',
        unauthorized: '❌ Você precisa estar autenticado.',
        facebook: `❌ Erro do Facebook: ${router.query.message || 'Tente novamente.'}`,
        database: '❌ Erro ao salvar. Tente novamente.',
        server: `❌ Erro do servidor: ${router.query.message || 'Tente novamente.'}`,
      };

      const errorMsg = errorMap[router.query.error as string] || '❌ Erro desconhecido.';
      setMessage({
        type: 'error',
        text: errorMsg,
      });
      setTimeout(() => setMessage(null), 5000);
      router.replace('/settings', undefined, { shallow: true });
    }
  }, [router.query, router]);

  const handleDisconnect = async () => {
    if (confirm('Tem certeza que deseja desconectar sua conta do Facebook?')) {
      try {
        await disconnectMutation.mutateAsync();
        setMessage({
          type: 'success',
          text: '✅ Desconectado com sucesso!',
        });
        setTimeout(() => setMessage(null), 5000);
      } catch (error) {
        setMessage({
          type: 'error',
          text: '❌ Erro ao desconectar. Tente novamente.',
        });
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  const handleReconnect = () => {
    window.location.href = '/api/auth/meta';
  };

  // ============= ESTADO: CARREGANDO =============
  if (isLoadingConnection) {
    return (
      <div className="rounded-[12px] border border-neon-green/20 bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-input" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-input" />
            <div className="h-3 w-60 animate-pulse rounded bg-input" />
          </div>
        </div>
      </div>
    );
  }

  // ============= TOAST/MESSAGE =============
  if (message) {
    const bgColor = message.type === 'success' ? 'bg-neon-green/10 border-neon-green/50' : 'bg-danger/10 border-danger/50';
    const textColor = message.type === 'success' ? 'text-neon-green' : 'text-danger';

    return (
      <div className={`mb-6 rounded-[12px] border ${bgColor} p-4 ${textColor}`}>
        {message.text}
      </div>
    );
  }

  // ============= ESTADO 1: NÃO CONECTADO =============
  if (!connection) {
    return (
      <div className="rounded-[12px] border border-neon-green/20 bg-card p-6 shadow-card">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <svg
              className="h-6 w-6 text-neon-cyan"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <h3 className="text-xl font-semibold text-primary">Conectar Meta Ads</h3>
          </div>
          <p className="text-sm text-secondary">
            Conecte sua conta do Facebook para acessar suas contas de anúncio, páginas e pixels.
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleReconnect}
          className="w-full rounded-[12px] bg-neon-green px-4 py-3 font-semibold text-deepest transition-all hover:bg-neon-green/90 focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-deepest"
        >
          Conectar com Facebook
        </button>

        {/* Info Box */}
        <div className="mt-4 rounded-[8px] border border-neon-cyan/20 bg-neon-cyan/5 p-3">
          <p className="text-xs text-secondary">
            🔒 Sua conexão é segura. Usamos OAuth 2.0 e tokens de longa duração (60 dias).
          </p>
        </div>
      </div>
    );
  }

  // ============= ESTADO 2: CONECTADO =============
  const expiresAt = new Date(connection.meta_token_expires_at || '');
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;
  const expiringTooSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

  const getBadgeStyles = () => {
    if (isExpired) {
      return {
        container: 'bg-danger/10 border-danger/50',
        icon: '🔴',
        text: 'Expirado',
        color: 'text-danger',
      };
    }
    if (expiringTooSoon) {
      return {
        container: 'bg-neon-amber/10 border-neon-amber/50',
        icon: '🟡',
        text: `Expira em ${daysUntilExpiry} dia${daysUntilExpiry !== 1 ? 's' : ''}`,
        color: 'text-neon-amber',
      };
    }
    return {
      container: 'bg-neon-green/10 border-neon-green/50',
      icon: '✅',
      text: 'Conectado',
      color: 'text-neon-green',
    };
  };

  const badge = getBadgeStyles();
  const connectedAt = new Date(connection.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="rounded-[12px] border border-neon-green/20 bg-card p-6 shadow-card">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-neon-cyan"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <h3 className="text-xl font-semibold text-primary">Meta Ads Conectado</h3>
          </div>

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${badge.container} ${badge.color}`}>
            <span>{badge.icon}</span>
            <span>{badge.text}</span>
          </div>
        </div>

        {/* Connection Info */}
        <div className="space-y-2 text-sm text-secondary">
          <p>
            <span className="font-semibold text-primary">Usuário:</span> {connection.meta_user_name}
          </p>
          <p>
            <span className="font-semibold text-primary">Conectado em:</span> {connectedAt}
          </p>
          <p>
            <span className="font-semibold text-primary">Expira em:</span> {expiresAt.toLocaleDateString('pt-BR')}
          </p>
          {connection.meta_scopes && (
            <p>
              <span className="font-semibold text-primary">Permissões:</span>{' '}
              <span className="text-xs">{connection.meta_scopes.split(',').join(', ')}</span>
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {/* Reconectar Button */}
        <button
          onClick={handleReconnect}
          disabled={disconnectMutation.isPending}
          className="flex-1 rounded-[12px] border border-neon-cyan/30 bg-transparent px-4 py-2 font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/10 disabled:opacity-50"
        >
          Reconectar
        </button>

        {/* Desconectar Button */}
        <button
          onClick={handleDisconnect}
          disabled={disconnectMutation.isPending}
          className="flex-1 rounded-[12px] border border-danger/30 bg-transparent px-4 py-2 font-semibold text-danger transition-all hover:bg-danger/10 disabled:opacity-50"
        >
          {disconnectMutation.isPending ? 'Desconectando...' : 'Desconectar'}
        </button>
      </div>

      {/* Warning if expired */}
      {isExpired && (
        <div className="mt-4 rounded-[8px] border border-danger/20 bg-danger/5 p-3">
          <p className="text-xs text-danger">
            ⚠️ Seu token expirou. Reconecte para sincronizar suas campanhas e anúncios.
          </p>
        </div>
      )}

      {/* Warning if expiring soon */}
      {expiringTooSoon && !isExpired && (
        <div className="mt-4 rounded-[8px] border border-neon-amber/20 bg-neon-amber/5 p-3">
          <p className="text-xs text-neon-amber">
            ⚠️ Seu token expira em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}. Reconecte em breve para não perder acesso.
          </p>
        </div>
      )}
    </div>
  );
};

export default MetaConnectionCard;
