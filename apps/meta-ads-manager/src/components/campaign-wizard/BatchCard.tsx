import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWizardStore, selectIsBatchValid } from '@/stores/wizard-store';
import type { BatchConfig, BatchAccountEntry, BatchPageEntry, BatchAdsetType } from '@/stores/wizard-store';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useMetaPages } from '@/hooks/useMetaPages';
import { authenticatedFetch } from '@/lib/api-client';

interface BatchCardProps {
  batch: BatchConfig;
  index: number;
}

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
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
            title="Duplicar lote"
            style={{ color: 'var(--color-tertiary)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          </button>
          {batchCount > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); removeBatch(batch.id); }}
              className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
              title="Remover lote"
              style={{ color: 'var(--color-danger)' }}
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(57, 255, 20, 0.1)',
                      color: isSelected ? 'var(--neon-green)' : 'var(--color-secondary)',
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
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                        style={{
                          backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(57, 255, 20, 0.1)',
                          color: isSelected ? '#00f0ff' : 'var(--color-secondary)',
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
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid rgba(57, 255, 20, 0.15)',
                  color: 'var(--color-primary)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
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
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid rgba(57, 255, 20, 0.15)',
                  color: 'var(--color-primary)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
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
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: 'rgba(57, 255, 20, 0.1)',
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                  color: 'var(--neon-green)',
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
                      className="p-1 rounded hover:bg-red-500/10 transition-colors"
                      style={{ color: 'var(--color-danger)' }}
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
                        className="w-full px-2 py-1.5 rounded text-xs outline-none"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(57, 255, 20, 0.15)',
                          color: 'var(--color-primary)',
                        }}
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
                        className="w-full px-2 py-1.5 rounded text-xs outline-none"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(57, 255, 20, 0.15)',
                          color: 'var(--color-primary)',
                        }}
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
                        className="w-full px-2 py-1.5 rounded text-xs outline-none"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(57, 255, 20, 0.15)',
                          color: 'var(--color-primary)',
                        }}
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
                        className="w-full px-2 py-1.5 rounded text-xs outline-none"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(57, 255, 20, 0.15)',
                          color: 'var(--color-primary)',
                        }}
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
                            className="flex-1 px-2 py-1 rounded text-[10px] font-medium transition-all"
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
                        className="w-full px-2 py-1.5 rounded text-xs outline-none"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(57, 255, 20, 0.15)',
                          color: 'var(--color-primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Config Summary */}
          <div
            className="px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(57, 255, 20, 0.03)',
              border: '1px solid rgba(57, 255, 20, 0.08)',
            }}
          >
            <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
              Objetivo: {batch.campaignConfig.objective.replace('OUTCOME_', '')}
              {' · '}
              Budget: {batch.campaignConfig.budgetType}
              {batch.campaignConfig.budgetValue > 0 && ` R$ ${(batch.campaignConfig.budgetValue / 100).toFixed(2)}`}
              {' · '}
              Status: {batch.campaignConfig.campaignStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
