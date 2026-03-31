import React, { useMemo } from 'react';
import { useWizardStore, selectIsBatchValid } from '@/stores/wizard-store';
import type { BatchConfig, BatchAccountEntry, BatchPageEntry } from '@/stores/wizard-store';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';

interface BatchCardProps {
  batch: BatchConfig;
  index: number;
}

export default function BatchCard({ batch, index }: BatchCardProps) {
  const isActive = useWizardStore((s) => s.activeBatchId === batch.id);
  // Memoize selector to prevent new reference each render (causes infinite re-render loop)
  const batchValidSelector = useMemo(() => selectIsBatchValid(batch.id), [batch.id]);
  const isValid = useWizardStore(batchValidSelector);
  const setActiveBatch = useWizardStore((s) => s.setActiveBatch);
  const updateBatch = useWizardStore((s) => s.updateBatch);
  const removeBatch = useWizardStore((s) => s.removeBatch);
  const duplicateBatch = useWizardStore((s) => s.duplicateBatch);
  const toggleBatchAccount = useWizardStore((s) => s.toggleBatchAccount);
  const toggleBatchPage = useWizardStore((s) => s.toggleBatchPage);
  const setBatchCampaignConfig = useWizardStore((s) => s.setBatchCampaignConfig);
  const batchCount = useWizardStore((s) => s.batches.length);

  const { data: allAccounts } = useMetaAccounts();

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

  const handleVolumeChange = (field: 'adsetsPerCampaign' | 'totalCampaigns', value: number) => {
    updateBatch(batch.id, { [field]: value });
  };

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

          {/* Campaign Config Summary */}
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--color-secondary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              Objetivo: {batch.campaignConfig.objective.replace('OUTCOME_', '')}
              {' · '}
              Budget: {batch.campaignConfig.budgetType}
              {batch.campaignConfig.budgetValue > 0 && ` R$ ${(batch.campaignConfig.budgetValue / 100).toFixed(2)}`}
              {' · '}
              Status: {batch.campaignConfig.campaignStatus}
            </label>
          </div>

          {/* Adset types count */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
              {batch.adsetTypes.length} tipo{batch.adsetTypes.length !== 1 ? 's' : ''} de adset configurado{batch.adsetTypes.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
