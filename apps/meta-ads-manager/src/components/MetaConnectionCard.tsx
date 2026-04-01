'use client';

import React, { useState, useEffect } from 'react';
import { useMetaConnection } from '@/hooks/useMetaConnection';

export const MetaConnectionCard: React.FC = () => {
  const { connection, isLoadingConnection, disconnectMutation } = useMetaConnection();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setMessage({ type: 'success', text: 'Facebook conectado com sucesso!' });
      setTimeout(() => setMessage(null), 5000);
      window.history.replaceState({}, '', '/settings');
    }
    const error = params.get('error');
    if (error) {
      const errorMap: Record<string, string> = {
        csrf: 'Erro de segurança (CSRF). Tente novamente.',
        unauthorized: 'Você precisa estar autenticado.',
        facebook: `Erro do Facebook: ${params.get('message') || 'Tente novamente.'}`,
        database: 'Erro ao salvar. Tente novamente.',
        server: `Erro do servidor: ${params.get('message') || 'Tente novamente.'}`,
      };
      setMessage({ type: 'error', text: errorMap[error] || 'Erro desconhecido.' });
      setTimeout(() => setMessage(null), 5000);
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleDisconnect = async () => {
    if (confirm('Tem certeza que deseja desconectar sua conta do Facebook?')) {
      try {
        await disconnectMutation.mutateAsync();
        setMessage({ type: 'success', text: 'Desconectado com sucesso!' });
        setTimeout(() => setMessage(null), 5000);
      } catch {
        setMessage({ type: 'error', text: 'Erro ao desconectar. Tente novamente.' });
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  const handleReconnect = () => { window.location.href = '/api/auth/meta'; };

  const cardStyle = {
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    fontFamily: 'var(--font-sans)',
  };

  const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-info)', flexShrink: 0 }}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );

  if (isLoadingConnection) {
    return (
      <div style={cardStyle}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-bg-input)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 animate-pulse rounded" style={{ backgroundColor: 'var(--color-bg-input)' }} />
            <div className="h-3 w-52 animate-pulse rounded" style={{ backgroundColor: 'var(--color-bg-input)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div
        className="p-3 rounded text-sm"
        style={{
          backgroundColor: message.type === 'success' ? 'rgba(57,255,20,0.06)' : 'rgba(255,45,120,0.06)',
          border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {message.text}
      </div>
    );
  }

  if (!connection) {
    return (
      <div style={cardStyle}>
        <div className="mb-5 flex items-center gap-2.5">
          <FacebookIcon />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Conectar Meta Ads</h3>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
          Conecte sua conta do Facebook para acessar suas contas de anúncio, páginas e pixels.
        </p>
        <button onClick={handleReconnect} className="btn-primary w-full justify-center">
          Conectar com Facebook
        </button>
        <div className="mt-3 p-3 rounded text-xs flex items-center gap-1.5" style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Conexão segura via OAuth 2.0. Tokens de longa duração (60 dias).
        </div>
      </div>
    );
  }

  const expiresAt = new Date(connection.meta_token_expires_at || '');
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;
  const expiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

  const badgeClass = isExpired ? 'badge-error' : expiringSoon ? 'badge-paused' : 'badge-active';
  const badgeText = isExpired ? 'Expirado' : expiringSoon ? `Expira em ${daysUntilExpiry}d` : 'Conectado';

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <FacebookIcon />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Meta Ads Conectado</h3>
        </div>
        <span className={badgeClass}>{badgeText}</span>
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
        <p><span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Usuário:</span> {connection.meta_user_name}</p>
        <p><span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Conectado em:</span> {new Date(connection.created_at).toLocaleDateString('pt-BR')}</p>
        <p><span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Expira em:</span> {expiresAt.toLocaleDateString('pt-BR')}</p>
        {connection.meta_scopes && (
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Permissões:</span>{' '}
            {connection.meta_scopes.split(',').join(', ')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleReconnect} disabled={disconnectMutation.isPending} className="btn-secondary flex-1 justify-center">
          Reconectar
        </button>
        <button onClick={handleDisconnect} disabled={disconnectMutation.isPending} className="btn-danger flex-1 justify-center" style={{ fontSize: '13px', padding: '8px 16px' }}>
          {disconnectMutation.isPending ? 'Desconectando...' : 'Desconectar'}
        </button>
      </div>

      {/* Warnings */}
      {(isExpired || expiringSoon) && (
        <div
          className="mt-3 p-3 rounded text-xs flex items-start gap-2"
          style={{
            backgroundColor: isExpired ? 'rgba(255,45,120,0.06)' : 'rgba(255,184,0,0.06)',
            border: `1px solid ${isExpired ? 'var(--color-danger)' : 'var(--color-warning)'}`,
            color: isExpired ? 'var(--color-danger)' : 'var(--color-warning)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            {isExpired
              ? 'Seu token expirou. Reconecte para sincronizar suas campanhas.'
              : `Seu token expira em ${daysUntilExpiry} dia${daysUntilExpiry !== 1 ? 's' : ''}. Reconecte em breve.`}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetaConnectionCard;
