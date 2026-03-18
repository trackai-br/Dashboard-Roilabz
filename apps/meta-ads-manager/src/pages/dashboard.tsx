import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPISection } from '@/components/KPISection';
import { CampaignsTableNew } from '@/components/CampaignsTableNew';
import { useMetaAccounts, useMetaAccountsKPIs } from '@/hooks/useMetaAccounts';
import { useMetaCampaigns } from '@/hooks/useMetaCampaigns';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();
  const [pageOffset, setPageOffset] = useState(0);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    } else {
      // Use system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
    }
  }, []);

  // Save dark mode preference
  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', JSON.stringify(enabled));
  };

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

  const errorMessage = accountsError?.message || kpisError?.message || campaignsError?.message;

  return (
    <DashboardLayout
      darkMode={darkMode}
      onDarkModeToggle={handleDarkModeToggle}
    >
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-300">
              ⚠️ {errorMessage}
            </p>
          </div>
        )}

        {/* Account Selector */}
        <div className="mb-8 flex items-center gap-4">
          <label htmlFor="account-select" className="font-medium text-gray-300">
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
            className="rounded-lg border border-dark-600/50 bg-dark-800 px-4 py-2 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-growth-500/50"
          >
            <option value="">Todas as Contas</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_name} ({account.account_id})
              </option>
            ))}
          </select>
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
          <h2 className="mb-4 text-lg font-semibold text-white">
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
              className="rounded-lg border border-dark-600/50 bg-dark-800 px-4 py-2 text-gray-300 disabled:opacity-50 hover:bg-dark-700 transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-400">
              Mostrando {pageOffset + 1} a {pageOffset + 50}
            </span>
            <button
              onClick={() => setPageOffset(pageOffset + 50)}
              className="rounded-lg border border-dark-600/50 bg-dark-800 px-4 py-2 text-gray-300 hover:bg-dark-700 transition-colors"
            >
              Próximo →
            </button>
          </div>
        </section>
      </DashboardLayout>
  );
}
