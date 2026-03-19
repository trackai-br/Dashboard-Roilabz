'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMetaSync } from '@/hooks/useMetaSync';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useMetaPages } from '@/hooks/useMetaPages';
import { useMetaPixels } from '@/hooks/useMetaPixels';
import { useRouter } from 'next/router';
import { RefreshCw } from 'lucide-react';

export default function CampaignsCentralPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const { sync, isSyncing, syncStatus, lastSync } = useMetaSync();
  const { data: accounts = [] } = useMetaAccounts();
  const { data: pages = [] } = useMetaPages(selectedAccountId);
  const { data: pixels = [] } = useMetaPixels(selectedAccountId);

  // Set first account as default
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleSync = () => {
    sync();
  };

  const handleStartConfiguration = () => {
    if (selectedAccountId) {
      router.push(`/campaigns/setup/wizard?accountId=${selectedAccountId}`);
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    return date.toLocaleString('pt-BR');
  };

  const isLoading = isSyncing || syncStatus === 'syncing';

  return (
    <DashboardLayout>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-deepest)' }}>
        {/* Header Section */}
        <div className="border-b" style={{ borderBottomColor: 'rgba(57, 255, 20, 0.2)' }}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1
                  className="text-4xl font-bold mb-2"
                  style={{
                    color: 'var(--neon-green)',
                    textShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    letterSpacing: '0.05em',
                  }}
                >
                  Central de Campanhas
                </h1>
                <p style={{ color: 'var(--color-secondary)' }} className="text-sm">
                  Gerencie suas contas, páginas e pixels de rastreamento
                </p>
              </div>

              {/* Sync Button */}
              <button
                onClick={handleSync}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                style={{
                  backgroundColor: isLoading ? 'rgba(57, 255, 20, 0.3)' : 'rgba(57, 255, 20, 0.1)',
                  color: 'var(--neon-green)',
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.2)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(57, 255, 20, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <RefreshCw
                  size={18}
                  className={isLoading ? 'animate-spin' : ''}
                />
                {isLoading ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>

            {/* Last Sync Info */}
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                color: 'var(--neon-cyan)',
              }}
            >
              Última sincronização: <strong>{formatLastSync()}</strong>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {accounts.length === 0 ? (
            // Empty State
            <div
              className="rounded-lg p-12 text-center"
              style={{
                backgroundColor: 'rgba(255, 183, 3, 0.05)',
                border: '1px solid rgba(255, 183, 3, 0.2)',
              }}
            >
              <p
                className="text-lg mb-4"
                style={{ color: 'var(--neon-amber)' }}
              >
                📊 Nenhuma conta sincronizada
              </p>
              <p style={{ color: 'var(--color-secondary)' }} className="mb-6">
                Clique no botão &quot;Sincronizar&quot; acima para importar suas contas de anúncio do Meta.
              </p>
              <button
                onClick={handleSync}
                disabled={isLoading}
                className="px-6 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: 'var(--neon-green)',
                  color: 'var(--bg-deepest)',
                  fontWeight: 600,
                }}
              >
                Sincronizar Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Ad Accounts */}
              <div>
                <h2
                  className="text-xl font-bold mb-4"
                  style={{
                    color: 'var(--neon-green)',
                    letterSpacing: '0.03em',
                  }}
                >
                  👤 Contas de Anúncio
                </h2>

                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className="p-4 rounded-lg cursor-pointer transition-all"
                      style={{
                        backgroundColor:
                          selectedAccountId === account.id
                            ? 'rgba(57, 255, 20, 0.15)'
                            : 'var(--bg-card)',
                        border:
                          selectedAccountId === account.id
                            ? '2px solid var(--neon-green)'
                            : '1px solid rgba(57, 255, 20, 0.2)',
                        boxShadow:
                          selectedAccountId === account.id
                            ? '0 0 12px rgba(57, 255, 20, 0.2)'
                            : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedAccountId !== account.id) {
                          e.currentTarget.style.borderColor =
                            'rgba(57, 255, 20, 0.4)';
                          e.currentTarget.style.backgroundColor =
                            'rgba(57, 255, 20, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedAccountId !== account.id) {
                          e.currentTarget.style.borderColor =
                            'rgba(57, 255, 20, 0.2)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                        }
                      }}
                    >
                      <h3
                        className="font-semibold mb-1"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {account.meta_account_name}
                      </h3>
                      <p
                        className="text-xs font-mono"
                        style={{ color: 'var(--color-secondary)' }}
                      >
                        ID: {account.meta_account_id}
                      </p>
                      <div className="flex gap-4 mt-3 pt-3" style={{ borderTopColor: 'rgba(57, 255, 20, 0.1)', borderTopWidth: '1px' }}>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            Moeda
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            {account.currency || 'USD'}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            Fuso Horário
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            {account.timezone || 'UTC'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Pages & Pixels */}
              <div className="space-y-8">
                {/* Business Pages */}
                <div>
                  <h2
                    className="text-xl font-bold mb-4"
                    style={{
                      color: 'var(--neon-cyan)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    📄 Páginas Empresariais
                  </h2>

                  {pages.length === 0 ? (
                    <div
                      className="p-4 rounded-lg text-center"
                      style={{
                        backgroundColor: 'rgba(0, 240, 255, 0.05)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{ color: 'var(--color-secondary)' }}
                      >
                        Nenhuma página encontrada para esta conta.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid rgba(0, 240, 255, 0.2)',
                          }}
                        >
                          <p
                            className="font-medium text-sm"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            {page.name}
                          </p>
                          <p
                            className="text-xs font-mono mt-1"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            ID: {page.id}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tracking Pixels */}
                <div>
                  <h2
                    className="text-xl font-bold mb-4"
                    style={{
                      color: 'var(--neon-green)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    📍 Pixels de Rastreamento
                  </h2>

                  {pixels.length === 0 ? (
                    <div
                      className="p-4 rounded-lg text-center"
                      style={{
                        backgroundColor: 'rgba(57, 255, 20, 0.05)',
                        border: '1px solid rgba(57, 255, 20, 0.2)',
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{ color: 'var(--color-secondary)' }}
                      >
                        Nenhum pixel encontrado para esta conta.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pixels.map((pixel) => (
                        <div
                          key={pixel.id}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid rgba(57, 255, 20, 0.2)',
                          }}
                        >
                          <p
                            className="font-medium text-sm"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            {pixel.name}
                          </p>
                          <p
                            className="text-xs font-mono mt-1"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            ID: {pixel.id}
                          </p>
                          {pixel.last_fired_time && (
                            <p
                              className="text-xs mt-2"
                              style={{ color: 'var(--neon-green)' }}
                            >
                              ✓ Último rastreamento:{' '}
                              {new Date(
                                pixel.last_fired_time * 1000
                              ).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-12 flex gap-4 justify-center">
            <button
              onClick={handleStartConfiguration}
              disabled={!selectedAccountId || accounts.length === 0}
              className="px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200"
              style={{
                backgroundColor:
                  selectedAccountId && accounts.length > 0
                    ? 'var(--neon-green)'
                    : '#666',
                color: selectedAccountId && accounts.length > 0 ? 'var(--bg-deepest)' : '#999',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 700,
                letterSpacing: '0.05em',
                boxShadow:
                  selectedAccountId && accounts.length > 0
                    ? '0 0 20px rgba(57, 255, 20, 0.4)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedAccountId && accounts.length > 0) {
                  e.currentTarget.style.boxShadow =
                    '0 0 30px rgba(57, 255, 20, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 0 20px rgba(57, 255, 20, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🚀 INICIAR CONFIGURAÇÃO
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
