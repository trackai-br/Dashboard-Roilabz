import React, { useState } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { authenticatedFetch } from '@/lib/api-client';

interface Tab7TemplateProps {
  onSaved: () => void;
}

export default function Tab7Template({ onSaved }: Tab7TemplateProps) {
  const { state } = useWizard();
  const [templateName, setTemplateName] = useState(state.templateName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headingFont = { fontFamily: "var(--font-sans)" };

  const totalAdsets = state.adsetTypes.reduce((s, t) => s + t.adsetCount * t.campaignsCount, 0);
  const totalCreatives = state.adConfig?.creativeFiles?.length ?? 0;
  const budgetDisplay = state.campaignConfig.budgetValue / 100;

  const OBJECTIVE_LABELS: Record<string, string> = {
    OUTCOME_SALES: 'Vendas',
    OUTCOME_LEADS: 'Leads',
    OUTCOME_TRAFFIC: 'Trafego',
    OUTCOME_AWARENESS: 'Reconhecimento',
    OUTCOME_ENGAGEMENT: 'Engajamento',
    OUTCOME_APP_PROMOTION: 'Instalacao de app',
  };

  const handleSave = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await authenticatedFetch('/api/templates/save', {
        method: 'POST',
        body: JSON.stringify({
          name: templateName.trim(),
          configJson: state,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao salvar');
      }

      // Delete draft
      await authenticatedFetch('/api/drafts/current', {
        method: 'DELETE',
      });

      onSaved();
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-accent)', ...headingFont }}>
            Salvar Template
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Escolha um nome descritivo para reutilizar esta configuracao no futuro.
          </p>
        </div>

        {/* Template Name Input */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            Nome do template
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Ex: Escala 5 contas - 50 adsets CBO"
            className="w-full px-4 py-3 rounded-lg border text-base outline-none"
            style={{
              backgroundColor: 'var(--color-bg-input)',
              borderColor: templateName.trim() ? 'rgba(57, 255, 20, 0.3)' : 'var(--color-border)',
              color: 'var(--color-text-primary)',
              ...headingFont,
            }}
          />
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Este template inclui:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <SummaryItem label="Contas" value={String(state.selectedAccountIds.length)} />
            <SummaryItem label="Paginas" value={String(state.selectedPageIds.length)} />
            <SummaryItem label="Tipos de adset" value={String(state.adsetTypes.length)} />
            <SummaryItem label="Total adsets" value={String(totalAdsets)} />
            <SummaryItem label="Objetivo" value={OBJECTIVE_LABELS[state.campaignConfig.objective] || state.campaignConfig.objective} />
            <SummaryItem label="Orcamento" value={`${state.campaignConfig.budgetType} R$${budgetDisplay.toFixed(2)}`} />
            <SummaryItem label="Campanhas" value={String(state.totalCampaigns)} />
            <SummaryItem label="Criativos" value={String(totalCreatives)} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 51, 51, 0.1)', border: '1px solid rgba(255, 51, 51, 0.3)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!templateName.trim() || saving}
          className="w-full py-3 rounded-lg text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: templateName.trim() ? 'var(--color-accent)' : 'rgba(57, 255, 20, 0.3)',
            color: 'var(--color-bg-base)',
            ...headingFont,
            letterSpacing: '0.04em',
            boxShadow: templateName.trim() ? '0 0 20px rgba(57, 255, 20, 0.4)' : 'none',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Template'}
        </button>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}: </span>
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}
