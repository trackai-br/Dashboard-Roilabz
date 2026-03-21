import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWizard } from '@/contexts/WizardContext';
import { calculateDistribution } from '@/lib/distribution';

interface PageWithAdsets {
  id: string;
  name: string;
  category?: string;
  activeAdsets: number;
  loading: boolean;
}

const MAX_ADSETS = 250;

export default function Tab2PagesVolume() {
  const { state, dispatch } = useWizard();
  const [distributionErrors, setDistributionErrors] = useState<string[]>([]);

  // Fetch pages for all selected accounts
  const { data: rawPages, isLoading: pagesLoading } = useQuery({
    queryKey: ['wizard-pages', state.selectedAccountIds],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const allPages: Array<{ id: string; name: string; category?: string }> = [];
      for (const accountId of state.selectedAccountIds) {
        const res = await fetch(`/api/meta/accounts/pages?accountId=${accountId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const pages = (data.pages || data.data || []) as Array<{ id: string; name: string; category?: string }>;
        allPages.push(...pages);
      }
      return allPages;
    },
    enabled: state.selectedAccountIds.length > 0,
    staleTime: 0, // Always refetch — pages may have been synced recently
  });

  // Build pages with adset counts
  const [pages, setPages] = useState<PageWithAdsets[]>([]);

  useEffect(() => {
    if (!rawPages) return;
    // Initialize pages with loading adset counts
    setPages(rawPages.map((p) => ({ ...p, activeAdsets: 0, loading: true })));

    // Fetch adset counts for each page
    const fetchCounts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const updated = await Promise.all(
        rawPages.map(async (p) => {
          try {
            const res = await fetch(`/api/meta/pages/${p.id}/adset-count`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (!res.ok) return { ...p, activeAdsets: 0, loading: false };
            const data = await res.json();
            return { ...p, activeAdsets: data.count || 0, loading: false };
          } catch {
            return { ...p, activeAdsets: 0, loading: false };
          }
        })
      );
      setPages(updated);
    };

    fetchCounts();
  }, [rawPages]);

  // Recalculate distribution when inputs change
  const accountsForDistribution = useMemo(() => {
    return state.selectedAccountIds.map((id) => ({ id, name: id }));
  }, [state.selectedAccountIds]);

  const pagesForDistribution = useMemo(() => {
    return pages
      .filter((p) => state.selectedPageIds.includes(p.id))
      .map((p) => ({ id: p.id, name: p.name, activeAdsets: p.activeAdsets }));
  }, [pages, state.selectedPageIds]);

  useEffect(() => {
    if (pagesForDistribution.length === 0 || state.adsetsPerCampaign <= 0 || state.totalCampaigns <= 0) {
      dispatch({ type: 'CALCULATE_DISTRIBUTION', payload: [] });
      setDistributionErrors([]);
      return;
    }

    const result = calculateDistribution({
      selectedAccounts: accountsForDistribution,
      selectedPages: pagesForDistribution,
      adsetsPerCampaign: state.adsetsPerCampaign,
      totalCampaigns: state.totalCampaigns,
    });

    dispatch({ type: 'CALCULATE_DISTRIBUTION', payload: result.distribution });
    setDistributionErrors(result.errors);
  }, [accountsForDistribution, pagesForDistribution, state.adsetsPerCampaign, state.totalCampaigns, dispatch]);

  const totalAdsets = state.adsetsPerCampaign * state.totalCampaigns;
  const pagesNeeded = Math.ceil(totalAdsets / MAX_ADSETS);

  const togglePage = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (page && page.activeAdsets >= MAX_ADSETS) return;
    dispatch({ type: 'TOGGLE_PAGE', payload: id });
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Pages */}
      <div>
        <h3
          className="text-lg font-bold mb-1"
          style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          Páginas Empresariais
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-secondary)' }}>
          Selecione as páginas onde as campanhas serão vinculadas
        </p>

        {state.selectedAccountIds.length === 0 ? (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)' }}>
            <p className="text-sm" style={{ color: 'var(--color-warning)' }}>Selecione pelo menos uma conta na etapa anterior.</p>
          </div>
        ) : pagesLoading ? (
          <div className="animate-pulse text-sm py-8 text-center" style={{ color: 'var(--color-secondary)' }}>
            Carregando páginas...
          </div>
        ) : pages.length === 0 ? (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)' }}>
            <p className="text-sm" style={{ color: 'var(--color-warning)' }}>Nenhuma página encontrada para as contas selecionadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {pages.map((page) => {
              const isFull = page.activeAdsets >= MAX_ADSETS;
              const isSelected = state.selectedPageIds.includes(page.id);
              const usage = page.activeAdsets / MAX_ADSETS;

              return (
                <button
                  key={page.id}
                  onClick={() => togglePage(page.id)}
                  disabled={isFull}
                  className="p-3 rounded-lg border text-left transition-all duration-150 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isFull
                      ? 'rgba(112, 112, 128, 0.05)'
                      : isSelected
                      ? 'rgba(57, 255, 20, 0.06)'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderColor: isFull
                      ? 'rgba(112, 112, 128, 0.2)'
                      : isSelected
                      ? 'rgba(57, 255, 20, 0.5)'
                      : 'var(--border-light)',
                    opacity: isFull ? 0.5 : 1,
                    boxShadow: isSelected ? '0 0 12px rgba(57, 255, 20, 0.15)' : 'none',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isSelected ? 'var(--neon-green)' : isFull ? 'var(--color-tertiary)' : 'var(--color-primary)' }}
                    >
                      {page.name}
                    </p>
                    {isSelected && (
                      <svg className="w-4 h-4 flex-shrink-0 ml-1" style={{ color: 'var(--neon-green)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(usage * 100, 100)}%`,
                          backgroundColor: usage > 0.9 ? 'var(--color-danger)' : usage > 0.7 ? 'var(--color-warning)' : 'var(--color-success)',
                        }}
                      />
                    </div>
                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-tertiary)' }}>
                      {page.loading ? '...' : `${page.activeAdsets}/${MAX_ADSETS}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Volume */}
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--border-light)' }}
      >
        <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          Definição de Volume
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>Adsets por campanha</label>
            <input
              type="number"
              min={1}
              max={250}
              value={state.adsetsPerCampaign}
              onChange={(e) => dispatch({ type: 'SET_VOLUME', payload: { adsetsPerCampaign: parseInt(e.target.value) || 0 } })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-light)',
                color: 'var(--color-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>Número de campanhas</label>
            <input
              type="number"
              min={1}
              value={state.totalCampaigns}
              onChange={(e) => dispatch({ type: 'SET_VOLUME', payload: { totalCampaigns: parseInt(e.target.value) || 0 } })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-light)',
                color: 'var(--color-primary)',
              }}
            />
          </div>
        </div>
        <div className="flex gap-4 text-xs" style={{ color: 'var(--color-secondary)' }}>
          <span>Total de adsets: <strong style={{ color: 'var(--neon-green)' }}>{totalAdsets}</strong></span>
          <span>Páginas necessárias: <strong style={{ color: 'var(--neon-cyan)' }}>~{pagesNeeded}</strong></span>
        </div>
      </div>

      {/* Section 3: Distribution Preview */}
      {(state.distributionMap.length > 0 || distributionErrors.length > 0) && (
        <div>
          <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            Preview da Distribuição
          </h4>

          {distributionErrors.length > 0 && (
            <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'rgba(255, 51, 51, 0.1)', border: '1px solid rgba(255, 51, 51, 0.3)' }}>
              {distributionErrors.map((err, i) => (
                <p key={i} className="text-sm" style={{ color: 'var(--color-danger)' }}>{err}</p>
              ))}
            </div>
          )}

          {state.distributionMap.length > 0 && (
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Campanha</th>
                    <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Página</th>
                    <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Conta</th>
                    <th className="px-3 py-2 text-right text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Adsets</th>
                  </tr>
                </thead>
                <tbody>
                  {state.distributionMap.map((entry, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td className="px-3 py-2" style={{ color: 'var(--color-primary)' }}>Campanha {entry.campaignIndex}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--neon-green)' }}>{entry.pageName}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--color-tertiary)' }}>{entry.accountId}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--neon-cyan)' }}>{entry.adsetCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
