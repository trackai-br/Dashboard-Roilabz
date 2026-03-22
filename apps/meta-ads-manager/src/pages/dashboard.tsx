import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPISection } from '@/components/KPISection';
import { CampaignsTableNew } from '@/components/CampaignsTableNew';
import { useMetaAccounts, useMetaAccountsKPIs } from '@/hooks/useMetaAccounts';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [pageOffset, setPageOffset] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useMetaAccounts();
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useMetaAccountsKPIs(selectedAccountId);
  const {
    data: campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useMetaCampaigns({
    accountId: selectedAccountId,
    limit: 50,
    offset: pageOffset,
  });

  // Set default account on load
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Handle account sync
  const handleSyncAccounts = async () => {
    setSyncLoading(true);
    setSyncMessage(null);

    try {
      // Get current session with access token
      const response = await authenticatedFetch('/api/meta/sync-all', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Sync failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      setSyncMessage({
        type: 'success',
        text: `✅ ${data.synced_accounts} conta(s), ${data.synced_pages} página(s), ${data.synced_pixels} pixel(s) sincronizado(s)`,
      });

      // Refetch all sync-related data
      queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });

      // Auto-hide message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      setSyncMessage({
        type: 'error',
        text: `❌ Erro ao sincronizar: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncLoading(false);
    }
  };

  const errorMessage = accountsError?.message || kpisError?.message || campaignsError?.message;

  return (
    <DashboardLayout>
        {errorMessage && (
          <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
              ⚠️ {errorMessage}
            </p>
          </div>
        )}

        {/* Sync Message */}
        {syncMessage && (
          <div
            className="mb-6 rounded-lg border p-4"
            style={{
              backgroundColor:
                syncMessage.type === 'success'
                  ? 'var(--color-success-bg)'
                  : 'var(--color-danger-bg)',
              borderColor:
                syncMessage.type === 'success'
                  ? 'var(--color-success)'
                  : 'var(--color-danger)',
            }}
          >
            <p
              className="text-sm font-medium"
              style={{
                color:
                  syncMessage.type === 'success'
                    ? 'var(--color-success)'
                    : 'var(--color-danger)',
              }}
            >
              {syncMessage.text}
            </p>
          </div>
        )}

        {/* Account Selector + Sync Button */}
        <div className="mb-8 flex items-center gap-4">
          <label htmlFor="account-select" className="font-medium" style={{ color: 'var(--color-primary)' }}>
            Conta:
          </label>
          <select
            id="account-select"
            value={selectedAccountId || ''}
            onChange={(e) => {
              setSelectedAccountId(e.target.value || undefined);
              setPageOffset(0);
            }}
            disabled={accountsLoading}
            className="input rounded-lg px-4 py-2 disabled:opacity-50"
          >
            <option value="">Todas as Contas</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.meta_account_name} ({account.meta_account_id})
              </option>
            ))}
          </select>

          <button
            onClick={handleSyncAccounts}
            disabled={syncLoading}
            className="rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-brand)',
              color: '#ffffff',
            }}
          >
            {syncLoading ? 'Sincronizando...' : '🔄 Sincronizar Tudo'}
          </button>
        </div>

        {/* KPI Section */}
        <KPISection
          data={{
            roas: kpis?.avgRoas || 0,
            activeCampaigns: campaigns?.length || 0,
            dailySpend: kpis?.totalSpend || 0,
            monthlySpend: kpis?.totalSpend || 0,
            conversions: 0,
          }}
        />

        {/* Campaign Table */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
            Campanhas
          </h2>
          <CampaignsTableNew
            campaigns={campaigns || []}
            loading={campaignsLoading}
            error={campaignsError?.message}
          />

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setPageOffset(Math.max(0, pageOffset - 50))}
              disabled={pageOffset === 0}
              className="rounded-lg border px-4 py-2 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}
            >
              ← Anterior
            </button>
            <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
              Mostrando {pageOffset + 1} a {pageOffset + 50}
            </span>
            <button
              onClick={() => setPageOffset(pageOffset + 50)}
              className="rounded-lg border px-4 py-2 transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)', color: 'var(--color-secondary)' }}
            >
              Próximo →
            </button>
          </div>
        </section>
      </DashboardLayout>
  );
}
