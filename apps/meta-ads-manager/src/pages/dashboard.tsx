import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPISection } from '@/components/KPISection';
import { CampaignsTableNew } from '@/components/CampaignsTableNew';
import { useMetaAccounts, useMetaAccountsKPIs } from '@/hooks/useMetaAccounts';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';
import { RefreshCw, ChevronDown } from 'lucide-react';

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [pageOffset, setPageOffset] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const response = await authenticatedFetch('/api/meta/sync-all', { method: 'POST' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || response.statusText);
      }
      const data = await response.json();
      setSyncMessage({
        type: 'success',
        text: `${data.synced_accounts} conta(s), ${data.synced_pages} página(s), ${data.synced_pixels} pixel(s) sincronizados`,
      });
      queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      setSyncMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncLoading(false);
    }
  };

  const errorMessage = accountsError?.message || kpisError?.message || campaignsError?.message;
  const kpisAreLoading = kpisLoading || accountsLoading;

  return (
    <DashboardLayout title="Dashboard">

      <div style={{ padding: '0' }}>

        {/* Error banner */}
        {errorMessage && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-danger)' }}>
              ⚠️ {errorMessage}
            </p>
          </div>
        )}

        {/* Sync message */}
        {syncMessage && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: syncMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${syncMessage.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: syncMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {syncMessage.text}
            </p>
          </div>
        )}

        {/* Toolbar — account selector + sync */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px 0',
          gap: '12px',
        }}>
          {/* Account selector */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              value={selectedAccountId || ''}
              onChange={e => { setSelectedAccountId(e.target.value || undefined); setPageOffset(0); }}
              disabled={accountsLoading}
              className="input"
              style={{ width: '240px', paddingRight: '32px', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Todas as contas</option>
              {accounts?.map(account => (
                <option key={account.id} value={account.id}>
                  {account.meta_account_name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }}
            />
          </div>

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              cursor: syncLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              opacity: syncLoading ? 0.6 : 1,
              transition: 'all 120ms ease',
            }}
            onMouseEnter={e => {
              if (!syncLoading) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-bg-surface)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
            }}
          >
            <RefreshCw size={13} strokeWidth={1.5} style={{ animation: syncLoading ? 'spin 1s linear infinite' : 'none' }} />
            {syncLoading ? 'Sincronizando...' : 'Sincronizar'}
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
            activePages: 0,
          }}
          loading={kpisAreLoading}
        />

        {/* Campaigns */}
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}>
              Campanhas
            </h2>
            {campaigns && campaigns.length > 0 && (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <CampaignsTableNew
            campaigns={campaigns || []}
            loading={campaignsLoading}
            error={campaignsError?.message}
          />

          {/* Pagination */}
          {(campaigns?.length || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                onClick={() => setPageOffset(Math.max(0, pageOffset - 50))}
                aria-label="Página anterior"
                disabled={pageOffset === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  cursor: pageOffset === 0 ? 'not-allowed' : 'pointer',
                  opacity: pageOffset === 0 ? 0.4 : 1,
                  transition: 'all 120ms ease',
                }}
              >
                ← Anterior
              </button>

              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                {pageOffset + 1} – {pageOffset + 50}
              </span>

              <button
                onClick={() => setPageOffset(pageOffset + 50)}
                aria-label="Próxima página"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                Próximo →
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
