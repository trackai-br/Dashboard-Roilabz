import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWizardStore, selectIsBatchValid } from '@/stores/wizard-store';
import type { BatchConfig, BatchAccountEntry, BatchPageEntry, BatchAdsetType, BatchCampaignConfig } from '@/stores/wizard-store';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useMetaPages } from '@/hooks/useMetaPages';
import { authenticatedFetch } from '@/lib/api-client';

interface BatchCardProps {
  batch: BatchConfig;
  index: number;
}

const OBJECTIVE_ICONS: Record<string, React.ReactNode> = {
  OUTCOME_SALES: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  ),
  OUTCOME_LEADS: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  ),
  OUTCOME_TRAFFIC: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  ),
  OUTCOME_AWARENESS: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  ),
  OUTCOME_ENGAGEMENT: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  OUTCOME_APP_PROMOTION: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  ),
};

const OBJECTIVES = [
  { value: 'OUTCOME_SALES', label: 'Vendas' },
  { value: 'OUTCOME_LEADS', label: 'Leads' },
  { value: 'OUTCOME_TRAFFIC', label: 'Trafego' },
  { value: 'OUTCOME_AWARENESS', label: 'Alcance' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento' },
  { value: 'OUTCOME_APP_PROMOTION', label: 'App' },
];

const BID_STRATEGIES = [
  { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Menor custo' },
  { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Bid Cap' },
  { value: 'COST_CAP', label: 'Cost Cap' },
  { value: 'LOWEST_COST_WITH_MIN_ROAS', label: 'Min ROAS' },
];

const CONVERSION_EVENTS = [
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'ADD_TO_CART', label: 'Adicionar ao carrinho' },
  { value: 'INITIATE_CHECKOUT', label: 'Iniciar checkout' },
  { value: 'VIEW_CONTENT', label: 'Visualizar conteudo' },
  { value: 'COMPLETE_REGISTRATION', label: 'Registro completo' },
];

const CONVERSION_LOCATIONS = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'APP', label: 'App' },
  { value: 'MESSAGING', label: 'Mensagens' },
];

export default function BatchCard({ batch, index }: BatchCardProps) {
  const isActive = useWizardStore((s) => s.activeBatchId === batch.id);
  const batchValidSelector = useMemo(() => selectIsBatchValid(batch.id), [batch.id]);
  const isValid = useWizardStore(batchValidSelector);
  const setActiveBatch = useWizardStore((s) => s.setActiveBatch);
  const updateBatch = useWizardStore((s) => s.updateBatch);
  const removeBatch = useWizardStore((s) => s.removeBatch);
  const duplicateBatch = useWizardStore((s) => s.duplicateBatch);
  const toggleBatchAccount = useWizardStore((s) => s.toggleBatchAccount);
  const toggleBatchPage = useWizardStore((s) => s.toggleBatchPage);
  const addBatchAdsetType = useWizardStore((s) => s.addBatchAdsetType);
  const removeBatchAdsetType = useWizardStore((s) => s.removeBatchAdsetType);
  const updateBatchAdsetType = useWizardStore((s) => s.updateBatchAdsetType);
  const batchCount = useWizardStore((s) => s.batches.length);
  const setBatchCampaignConfig = useWizardStore((s) => s.setBatchCampaignConfig);

  const [showAdsetForm, setShowAdsetForm] = useState(false);

  const { data: allAccounts } = useMetaAccounts();

  // Fetch pages for first selected account
  const firstAccountId = batch.accounts[0]?.accountId;
  const { data: pagesForAccount } = useMetaPages(firstAccountId);

  // Fetch pixels for ALL selected accounts (same pattern as v1 Tab4Adsets)
  const selectedAccountIds = useMemo(() => batch.accounts.map(a => a.accountId), [batch.accounts]);
  const { data: pixelsForAccount } = useQuery({
    queryKey: ['wizard-pixels', selectedAccountIds],
    queryFn: async () => {
      const pixels: Array<{ id: string; name: string }> = [];
      for (const accountId of selectedAccountIds) {
        try {
          const res = await authenticatedFetch(`/api/meta/accounts/pixels?accountId=${accountId}`);
          if (!res.ok) continue;
          const data = await res.json();
          for (const p of data.pixels || []) {
            if (!pixels.some((x) => x.id === p.id)) pixels.push(p);
          }
        } catch { /* skip failed accounts */ }
      }
      return pixels;
    },
    enabled: selectedAccountIds.length > 0,
    staleTime: 0,
  });

  const handleToggleExpand = () => {
    updateBatch(batch.id, { isExpanded: !batch.isExpanded });
    setActiveBatch(batch.id);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBatch(batch.id, { name: e.target.value });
  };

  const handleAccountToggle = (account: BatchAccountEntry) => {
    toggleBatchAccount(batch.id, account);
  };

  const handlePageToggle = (page: BatchPageEntry) => {
    toggleBatchPage(batch.id, page);
  };

  const handleVolumeChange = (field: 'adsetsPerCampaign' | 'totalCampaigns', value: number) => {
    updateBatch(batch.id, { [field]: value });
  };

  const updateCampaignConfig = (updates: Partial<BatchCampaignConfig>) => {
    setBatchCampaignConfig(batch.id, { ...batch.campaignConfig, ...updates });
  };

  const handleAddAdsetType = useCallback(() => {
    const newAdset: BatchAdsetType = {
      id: `adset-${Date.now()}`,
      name: `Conjunto ${batch.adsetTypes.length + 1}`,
      adsetCount: 1,
      campaignsCount: batch.totalCampaigns,
      creativesInAdset: [],
      conversionLocation: 'WEBSITE',
      pixelId: pixelsForAccount?.[0]?.id || '',
      conversionEvent: 'PURCHASE',
      startDate: new Date().toISOString().split('T')[0],
      targetCountries: ['BR'],
      adsetStatus: 'PAUSED',
    };
    addBatchAdsetType(batch.id, newAdset);
    setShowAdsetForm(false);
  }, [batch.id, batch.adsetTypes.length, batch.totalCampaigns, pixelsForAccount, addBatchAdsetType]);

  const summary = [
    `${batch.accounts.length} conta${batch.accounts.length !== 1 ? 's' : ''}`,
    `${batch.pages.length} pagina${batch.pages.length !== 1 ? 's' : ''}`,
    `${batch.totalCampaigns} camp.`,
    `${batch.adsetsPerCampaign} adsets/camp`,
  ].join(' · ');

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: isActive ? 'rgba(57, 255, 20, 0.03)' : 'rgba(255, 255, 255, 0.02)',
        borderColor: isActive
          ? 'rgba(57, 255, 20, 0.3)'
          : isValid
          ? 'rgba(0, 255, 136, 0.2)'
          : 'rgba(57, 255, 20, 0.1)',
        boxShadow: isActive ? '0 0 12px rgba(57, 255, 20, 0.1)' : 'none',
      }}
    >
      {/* Header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={handleToggleExpand}
      >
        {/* Expand/collapse */}
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--color-tertiary)',
            transform: batch.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* Batch name */}
        <input
          type="text"
          value={batch.name}
          onChange={handleNameChange}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-none outline-none text-sm font-semibold flex-1 min-w-0"
          style={{
            color: isActive ? 'var(--neon-green)' : 'var(--color-primary)',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            letterSpacing: '0.03em',
          }}
        />

        {/* Status badge */}
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: isValid
              ? 'rgba(0, 255, 136, 0.15)'
              : 'rgba(255, 183, 3, 0.15)',
            color: isValid ? 'var(--color-success)' : 'var(--color-warning)',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
          }}
        >
          {isValid ? 'Completo' : 'Incompleto'}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); duplicateBatch(batch.id); }}
            className="p-1.5 rounded-md hover:bg-white/5 cursor-pointer focus:outline-none"
            title="Duplicar lote"
            style={{ color: 'var(--color-tertiary)', transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          </button>
          {batchCount > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); removeBatch(batch.id); }}
              className="p-1.5 rounded-md hover:bg-red-500/10 cursor-pointer focus:outline-none"
              title="Remover lote"
              style={{ color: 'var(--color-danger)', transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Summary — collapsed view */}
      {!batch.isExpanded && (
        <div className="px-4 pb-3">
          <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
            {summary}
          </p>
        </div>
      )}

      {/* Expanded content */}
      {batch.isExpanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(57, 255, 20, 0.05)' }}>
          {/* Accounts selector */}
          <div className="pt-4">
            <label
              className="block text-xs font-medium mb-2"
              style={{
                color: 'var(--color-secondary)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
              }}
            >
              Contas de Anuncio
            </label>
            <div className="flex flex-wrap gap-2">
              {(allAccounts || []).map((acc: any) => {
                const isSelected = batch.accounts.some(a => a.accountId === acc.meta_account_id);
                return (
                  <button
                    key={acc.meta_account_id}
                    onClick={() => handleAccountToggle({
                      accountId: acc.meta_account_id,
                      accountName: acc.meta_account_name || 'Sem nome',
                      currency: acc.currency || 'USD',
                    })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer focus:outline-none"
                    style={{
                      backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(57, 255, 20, 0.35)' : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--neon-green)' : 'var(--color-secondary)',
                      transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {acc.meta_account_name || acc.meta_account_id}
                    {isSelected && (
                      <svg width="12" height="12" className="inline ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pages selector */}
          {batch.accounts.length > 0 && (
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{
                  color: 'var(--color-secondary)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
              >
                Paginas Facebook
              </label>
              {pagesForAccount && pagesForAccount.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pagesForAccount.map((page: any) => {
                    const isSelected = batch.pages.some(p => p.pageId === page.id);
                    return (
                      <button
                        key={page.id}
                        onClick={() => handlePageToggle({
                          pageId: page.id,
                          pageName: page.name || 'Sem nome',
                          accountId: firstAccountId,
                        })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer focus:outline-none"
                        style={{
                          backgroundColor: isSelected ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid rgba(0, 212, 255, 0.35)' : '1px solid var(--border-subtle)',
                          color: isSelected ? 'var(--color-info)' : 'var(--color-secondary)',
                          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        {page.name || page.id}
                        {isSelected && (
                          <svg width="12" height="12" className="inline ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
                  {batch.accounts.length > 0 ? 'Carregando paginas...' : 'Selecione uma conta primeiro'}
                </p>
              )}
            </div>
          )}

          {/* Volume */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--color-secondary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Campanhas
              </label>
              <input
                type="number"
                min={1}
                value={batch.totalCampaigns}
                onChange={(e) => handleVolumeChange('totalCampaigns', parseInt(e.target.value) || 1)}
                className="input w-full text-sm"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--color-secondary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Adsets por campanha
              </label>
              <input
                type="number"
                min={1}
                max={250}
                value={batch.adsetsPerCampaign}
                onChange={(e) => handleVolumeChange('adsetsPerCampaign', Math.min(250, parseInt(e.target.value) || 1))}
                className="input w-full text-sm"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              />
            </div>
          </div>

          {/* Real-time calculation */}
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(57, 255, 20, 0.05)',
              border: '1px solid rgba(57, 255, 20, 0.1)',
            }}
          >
            <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>
              Total:
            </span>
            <span
              className="text-xs font-semibold"
              style={{
                color: 'var(--neon-green)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
              }}
            >
              {batch.totalCampaigns} campanha{batch.totalCampaigns !== 1 ? 's' : ''}
              {' x '}
              {batch.adsetsPerCampaign} adsets
              {' = '}
              {batch.totalCampaigns * batch.adsetsPerCampaign} adsets totais
            </span>
          </div>

          {/* Adset Types */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="block text-xs font-medium"
                style={{
                  color: 'var(--color-secondary)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
              >
                Tipos de Conjunto (Ad Sets)
              </label>
              <button
                onClick={handleAddAdsetType}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium cursor-pointer focus:outline-none"
                style={{
                  backgroundColor: 'rgba(57, 255, 20, 0.08)',
                  border: '1px solid rgba(57, 255, 20, 0.25)',
                  color: 'var(--neon-green)',
                  transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adicionar
              </button>
            </div>

            {batch.adsetTypes.length === 0 && (
              <div
                className="p-3 rounded-lg text-center"
                style={{
                  backgroundColor: 'rgba(255, 183, 3, 0.08)',
                  border: '1px dashed rgba(255, 183, 3, 0.3)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--color-warning)' }}>
                  Nenhum conjunto configurado. Clique em &quot;Adicionar&quot; para criar.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {batch.adsetTypes.map((adset) => (
                <div
                  key={adset.id}
                  className="p-3 rounded-lg space-y-3"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(57, 255, 20, 0.1)',
                  }}
                >
                  {/* Adset header */}
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={adset.name}
                      onChange={(e) => updateBatchAdsetType(batch.id, adset.id, { name: e.target.value })}
                      className="bg-transparent border-none outline-none text-xs font-semibold"
                      style={{ color: 'var(--color-primary)' }}
                    />
                    <button
                      onClick={() => removeBatchAdsetType(batch.id, adset.id)}
                      className="p-1 rounded hover:bg-red-500/10 cursor-pointer focus:outline-none"
                      style={{ color: 'var(--color-danger)', transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Adset config grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Pixel */}
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Pixel</label>
                      <select
                        value={adset.pixelId}
                        onChange={(e) => updateBatchAdsetType(batch.id, adset.id, { pixelId: e.target.value })}
                        className="input-sm"
                        style={{}}
                      >
                        <option value="">Sem pixel</option>
                        {(pixelsForAccount || []).map((px: any) => (
                          <option key={px.id} value={px.id}>{px.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Conversion Event */}
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Evento de Conversao</label>
                      <select
                        value={adset.conversionEvent}
                        onChange={(e) => updateBatchAdsetType(batch.id, adset.id, { conversionEvent: e.target.value })}
                        className="input-sm"
                        style={{}}
                      >
                        {CONVERSION_EVENTS.map((ev) => (
                          <option key={ev.value} value={ev.value}>{ev.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Conversion Location */}
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Local de Conversao</label>
                      <select
                        value={adset.conversionLocation}
                        onChange={(e) => updateBatchAdsetType(batch.id, adset.id, { conversionLocation: e.target.value })}
                        className="input-sm"
                        style={{}}
                      >
                        {CONVERSION_LOCATIONS.map((loc) => (
                          <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Target Countries */}
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Paises</label>
                      <input
                        type="text"
                        value={adset.targetCountries.join(', ')}
                        onChange={(e) => updateBatchAdsetType(batch.id, adset.id, {
                          targetCountries: e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean),
                        })}
                        placeholder="BR, US"
                        className="input-sm"
                        style={{}}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Status</label>
                      <div className="flex gap-1">
                        {(['PAUSED', 'ACTIVE'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateBatchAdsetType(batch.id, adset.id, { adsetStatus: status })}
                            className="flex-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer focus:outline-none"
                            style={{
                              backgroundColor: adset.adsetStatus === status ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.03)',
                              border: adset.adsetStatus === status ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                              color: adset.adsetStatus === status ? 'var(--neon-green)' : 'var(--color-tertiary)',
                            }}
                          >
                            {status === 'PAUSED' ? 'Pausado' : 'Ativo'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Data de Inicio</label>
                      <input
                        type="date"
                        value={adset.startDate}
                        onChange={(e) => updateBatchAdsetType(batch.id, adset.id, { startDate: e.target.value })}
                        className="input-sm"
                        style={{}}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Config */}
          <div className="space-y-3">
            <label
              className="block text-xs font-medium"
              style={{ color: 'var(--color-secondary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              Configuracao da Campanha
            </label>

            {/* Objective */}
            <div>
              <label className="block text-[10px] mb-1.5" style={{ color: 'var(--color-tertiary)' }}>Objetivo</label>
              <div className="grid grid-cols-3 gap-1.5">
                {OBJECTIVES.map((obj) => {
                  const isObj = batch.campaignConfig.objective === obj.value;
                  return (
                    <button
                      key={obj.value}
                      onClick={() => updateCampaignConfig({ objective: obj.value })}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: isObj ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: isObj ? '1px solid rgba(57, 255, 20, 0.35)' : '1px solid var(--border-subtle)',
                        color: isObj ? 'var(--neon-green)' : 'var(--color-secondary)',
                        transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {OBJECTIVE_ICONS[obj.value]}
                      {obj.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget Type + Value */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Orcamento</label>
                <div className="flex gap-1">
                  {(['CBO', 'ABO'] as const).map((bt) => (
                    <button
                      key={bt}
                      onClick={() => updateCampaignConfig({ budgetType: bt })}
                      className="flex-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: batch.campaignConfig.budgetType === bt ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: batch.campaignConfig.budgetType === bt ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: batch.campaignConfig.budgetType === bt ? 'var(--neon-green)' : 'var(--color-tertiary)',
                      }}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>
                  Valor ({batch.campaignConfig.budgetType === 'CBO' ? 'por campanha' : 'por conjunto'})
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={batch.campaignConfig.budgetValue}
                  onChange={(e) => updateCampaignConfig({ budgetValue: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 5000 (centavos)"
                  className="input-sm font-mono"
                  style={{}}
                />
              </div>
            </div>

            {/* Bid Strategy + Campaign Status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Estrategia de Lance</label>
                <select
                  value={batch.campaignConfig.bidStrategy}
                  onChange={(e) => updateCampaignConfig({ bidStrategy: e.target.value })}
                  className="input-sm cursor-pointer"
                  style={{}}
                >
                  {BID_STRATEGIES.map((bs) => (
                    <option key={bs.value} value={bs.value}>{bs.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Status da Campanha</label>
                <div className="flex gap-1">
                  {(['PAUSED', 'ACTIVE'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateCampaignConfig({ campaignStatus: status })}
                      className="flex-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: batch.campaignConfig.campaignStatus === status ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: batch.campaignConfig.campaignStatus === status ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: batch.campaignConfig.campaignStatus === status ? 'var(--neon-green)' : 'var(--color-tertiary)',
                      }}
                    >
                      {status === 'PAUSED' ? 'Pausado' : 'Ativo'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Naming Pattern */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Numero da Leva</label>
                <input
                  type="text"
                  value={batch.campaignConfig.namingPattern.levaNumber}
                  onChange={(e) => updateCampaignConfig({ namingPattern: { ...batch.campaignConfig.namingPattern, levaNumber: e.target.value } })}
                  placeholder="Ex: 01"
                  className="w-full px-2 py-1.5 rounded text-xs outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(57, 255, 20, 0.15)',
                    color: 'var(--color-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'var(--color-tertiary)' }}>Label do Criativo</label>
                <input
                  type="text"
                  value={batch.campaignConfig.namingPattern.creativeLabel}
                  onChange={(e) => updateCampaignConfig({ namingPattern: { ...batch.campaignConfig.namingPattern, creativeLabel: e.target.value } })}
                  placeholder="Ex: ESPORTIVA"
                  className="w-full px-2 py-1.5 rounded text-xs outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(57, 255, 20, 0.15)',
                    color: 'var(--color-primary)',
                  }}
                />
              </div>
            </div>

            {/* Naming Preview */}
            {(batch.campaignConfig.namingPattern.levaNumber || batch.campaignConfig.namingPattern.creativeLabel) && (
              <div
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.15)' }}
              >
                <span className="text-[10px]" style={{ color: 'var(--color-tertiary)' }}>Preview: </span>
                <span className="text-[10px] font-mono" style={{ color: '#00f0ff' }}>
                  [DATA][CONTA][CP 01][LEVA {batch.campaignConfig.namingPattern.levaNumber || '??'}][PAGINA] {batch.campaignConfig.namingPattern.creativeLabel || '??'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
