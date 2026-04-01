import React, { useMemo } from 'react';
import { useWizard, CampaignConfig } from '@/contexts/WizardContext';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';

const OBJECTIVES = [
  { value: 'OUTCOME_SALES', label: 'Vendas', icon: '🛒' },
  { value: 'OUTCOME_LEADS', label: 'Leads', icon: '📋' },
  { value: 'OUTCOME_TRAFFIC', label: 'Tráfego', icon: '🔗' },
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento', icon: '📢' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento', icon: '💬' },
  { value: 'OUTCOME_APP_PROMOTION', label: 'Instalação de app', icon: '📱' },
];

const BID_STRATEGIES = [
  { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Volume Mais Alto' },
  { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Bid Cap' },
  { value: 'COST_CAP', label: 'Cost Cap' },
  { value: 'LOWEST_COST_WITH_MIN_ROAS', label: 'ROAS Mínimo' },
];

export default function Tab3Campaign() {
  const { state, dispatch } = useWizard();
  const { data: accounts } = useMetaAccounts();
  const config = state.campaignConfig;

  const update = (partial: Partial<CampaignConfig>) => {
    dispatch({ type: 'SET_CAMPAIGN_CONFIG', payload: { ...config, ...partial } });
  };

  const updateNaming = (field: 'levaNumber' | 'creativeLabel', value: string) => {
    dispatch({
      type: 'SET_CAMPAIGN_CONFIG',
      payload: {
        ...config,
        namingPattern: { ...config.namingPattern, [field]: value },
      },
    });
  };

  // Example values for naming preview
  const previewValues = useMemo(() => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;

    const selectedAccount = accounts?.find((a) => state.selectedAccountIds.includes(a.meta_account_id));
    const accountName = selectedAccount?.meta_account_name || 'Conta';

    const firstPage = state.distributionMap[0]?.pageName || 'Página';

    return { dateStr, accountName, firstPage };
  }, [accounts, state.selectedAccountIds, state.distributionMap]);

  const namingPreview = `[${previewValues.dateStr}][${previewValues.accountName}][CP 01][LEVA ${config.namingPattern.levaNumber || '??'}][${previewValues.firstPage}] ${config.namingPattern.creativeLabel || '??'}`;

  // Budget calculations
  const budgetDisplay = config.budgetValue / 100;
  const totalBudget = config.budgetType === 'CBO'
    ? budgetDisplay * state.totalCampaigns
    : budgetDisplay * (state.adsetsPerCampaign * state.totalCampaigns);

  const needsBidCapField = config.bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || config.bidStrategy === 'COST_CAP';

  return (
    <div className="space-y-6">
      {/* Section 1 — Objetivo */}
      <div>
        <h3
          className="text-lg font-bold mb-1"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Objetivo da Campanha
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Selecione o objetivo principal das campanhas
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {OBJECTIVES.map((obj) => {
            const isSelected = config.objective === obj.value;
            return (
              <button
                key={obj.value}
                onClick={() => update({ objective: obj.value })}
                className="p-4 rounded-lg border text-left transition-all duration-150"
                style={{
                  backgroundColor: isSelected ? 'rgba(22, 163, 74, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isSelected ? 'rgba(22, 163, 74, 0.5)' : 'var(--color-border)',
                  boxShadow: isSelected ? '0 0 0 rgba(22, 163, 74, 0.15)' : 'none',
                }}
              >
                <span className="text-2xl mb-2 block">{obj.icon}</span>
                <p
                  className="text-sm font-medium"
                  style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                >
                  {obj.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2 — Nomenclatura */}
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--color-border)' }}
      >
        <h4
          className="text-sm font-bold mb-3"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Nomenclatura da Campanha
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Número da Leva
            </label>
            <input
              type="text"
              value={config.namingPattern.levaNumber}
              onChange={(e) => updateNaming('levaNumber', e.target.value)}
              placeholder="08"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Identificação do Criativo
            </label>
            <input
              type="text"
              value={config.namingPattern.creativeLabel}
              onChange={(e) => updateNaming('creativeLabel', e.target.value)}
              placeholder="Cr1"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Preview do nome:</p>
          <p className="text-sm font-mono break-all" style={{ color: 'var(--color-accent-bright)' }}>
            {namingPreview}
          </p>
        </div>

        <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Os valores entre colchetes são preenchidos automaticamente pelo sistema na hora da publicação.
        </p>
      </div>

      {/* Section 3 — Tipo de Orçamento */}
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--color-border)' }}
      >
        <h4
          className="text-sm font-bold mb-3"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Tipo de Orçamento
        </h4>

        {/* CBO / ABO Toggle */}
        <div className="flex gap-2 mb-4">
          {(['CBO', 'ABO'] as const).map((type) => {
            const isActive = config.budgetType === type;
            return (
              <button
                key={type}
                onClick={() => update({ budgetType: type })}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? 'rgba(22, 163, 74, 0.1)' : 'transparent',
                  borderColor: isActive ? 'rgba(22, 163, 74, 0.5)' : 'var(--color-border)',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {type}
              </button>
            );
          })}
        </div>

        <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          {config.budgetType === 'CBO' ? 'Orçamento por campanha' : 'Orçamento por conjunto (adset)'}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>R$</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={budgetDisplay || ''}
            onChange={(e) => update({ budgetValue: Math.round(parseFloat(e.target.value || '0') * 100) })}
            placeholder="0.00"
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-input)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {config.budgetValue > 0 && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Total programado:{' '}
            <strong style={{ color: 'var(--color-accent)' }}>
              R$ {totalBudget.toFixed(2)}
            </strong>
            {config.budgetType === 'CBO'
              ? ` (${budgetDisplay.toFixed(2)} × ${state.totalCampaigns} campanhas)`
              : ` (${budgetDisplay.toFixed(2)} × ${state.adsetsPerCampaign * state.totalCampaigns} adsets)`}
          </p>
        )}
      </div>

      {/* Section 4 — Estratégia de Lance */}
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--color-border)' }}
      >
        <h4
          className="text-sm font-bold mb-3"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Estratégia de Lance
        </h4>

        <select
          value={config.bidStrategy}
          onChange={(e) => update({ bidStrategy: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-input)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          {BID_STRATEGIES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {needsBidCapField && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            O valor do lance será definido por tipo de adset na próxima etapa.
          </p>
        )}
      </div>

      {/* Section 5 — Status */}
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--color-border)' }}
      >
        <h4
          className="text-sm font-bold mb-3"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Status da Campanha
        </h4>

        <div className="flex gap-2">
          {(['ACTIVE', 'PAUSED'] as const).map((status) => {
            const isActive = config.campaignStatus === status;
            const label = status === 'ACTIVE' ? 'Ativa' : 'Pausada';
            const color = status === 'ACTIVE' ? 'var(--color-accent)' : 'var(--color-warning)';
            return (
              <button
                key={status}
                onClick={() => update({ campaignStatus: status })}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? `${status === 'ACTIVE' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(255, 183, 3, 0.1)'}` : 'transparent',
                  borderColor: isActive ? color : 'var(--color-border)',
                  color: isActive ? color : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
