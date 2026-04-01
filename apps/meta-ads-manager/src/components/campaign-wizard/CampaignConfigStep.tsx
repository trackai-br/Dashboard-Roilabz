import React, { useMemo, useState, useCallback } from 'react';
import { useWizardStore, selectBatches, selectActiveBatch } from '@/stores/wizard-store';
import type { BatchCampaignConfig } from '@/stores/wizard-store';

const OBJECTIVES = [
  { value: 'OUTCOME_SALES', label: 'Vendas', icon: '🛒' },
  { value: 'OUTCOME_LEADS', label: 'Leads', icon: '📋' },
  { value: 'OUTCOME_TRAFFIC', label: 'Trafego', icon: '🔗' },
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento', icon: '📢' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento', icon: '💬' },
  { value: 'OUTCOME_APP_PROMOTION', label: 'Instalacao de app', icon: '📱' },
];

const BID_STRATEGIES = [
  { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Volume Mais Alto' },
  { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Bid Cap' },
  { value: 'COST_CAP', label: 'Cost Cap' },
  { value: 'LOWEST_COST_WITH_MIN_ROAS', label: 'ROAS Minimo' },
];

export default function CampaignConfigStep() {
  const batches = useWizardStore(selectBatches);
  const activeBatch = useWizardStore(selectActiveBatch);
  const setBatchCampaignConfig = useWizardStore((s) => s.setBatchCampaignConfig);
  const updateNamingTag = useWizardStore((s) => s.updateNamingTag);
  const addNamingTag = useWizardStore((s) => s.addNamingTag);
  const removeNamingTag = useWizardStore((s) => s.removeNamingTag);
  const reorderNamingTags = useWizardStore((s) => s.reorderNamingTags);

  const [perLoteCustom, setPerLoteCustom] = useState(false);
  const [draggedTag, setDraggedTag] = useState<string | null>(null);

  // Batch selecionado para configuracao (ativo ou primeiro)
  const batch = activeBatch ?? batches[0] ?? null;
  const config = batch?.campaignConfig ?? null;

  const updateConfig = useCallback((updates: Partial<BatchCampaignConfig>) => {
    if (!batch || !config) return;
    const newConfig = { ...config, ...updates };
    setBatchCampaignConfig(batch.id, newConfig);
  }, [batch, config, setBatchCampaignConfig]);

  const updateNaming = useCallback((field: 'levaNumber' | 'creativeLabel', value: string) => {
    if (!batch || !config) return;
    setBatchCampaignConfig(batch.id, {
      ...config,
      namingPattern: { ...config.namingPattern, [field]: value },
    });
  }, [batch, config, setBatchCampaignConfig]);

  // Naming preview
  const namingPreview = useMemo(() => {
    if (!batch || !config) return '';
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}`;
    const accountName = batch.accounts[0]?.accountName || 'Conta';
    const pageName = batch.pages[0]?.pageName || 'Pagina';

    return config.namingTags.map((tag) => {
      switch (tag.type) {
        case 'date': return `[${dateStr}]`;
        case 'account': return `[${accountName}]`;
        case 'campaign_number': return `[CP 01]`;
        case 'leva': return `[LEVA ${config.namingPattern.levaNumber || '??'}]`;
        case 'page': return `[${pageName}]`;
        case 'creative': return `[${config.namingPattern.creativeLabel || '??'}]`;
        case 'text': return tag.value ? `[${tag.value}]` : '[texto]';
        case 'sequence': return `[#01]`;
        default: return '';
      }
    }).join(' ');
  }, [batch, config]);

  // Early return after all hooks
  if (!batch || !config) return null;

  const budgetDisplay = config.budgetValue / 100;
  const needsBidCapField = config.bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || config.bidStrategy === 'COST_CAP';

  // Drag handlers for naming tags
  const handleDragStart = (tagId: string) => setDraggedTag(tagId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetTagId: string) => {
    if (!draggedTag || draggedTag === targetTagId) return;
    const tags = [...config.namingTags];
    const fromIndex = tags.findIndex((t) => t.id === draggedTag);
    const toIndex = tags.findIndex((t) => t.id === targetTagId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = tags.splice(fromIndex, 1);
    tags.splice(toIndex, 0, moved);
    reorderNamingTags(batch.id, tags);
    setDraggedTag(null);
  };

  const handleAddTextTag = () => {
    addNamingTag(batch.id, {
      id: `tag-text-${Date.now()}`,
      type: 'text',
      label: 'Texto',
      value: '',
      color: '#888888',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Configuracao de Campanha
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {perLoteCustom ? `Configurando: ${batch.name}` : 'Config compartilhada entre todos os lotes'}
        </p>
      </div>

      {/* Per-lote toggle */}
      {batches.length > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPerLoteCustom(!perLoteCustom)}
            className="relative w-10 h-5 rounded-full transition-all"
            style={{
              backgroundColor: perLoteCustom ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
            }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: perLoteCustom ? '22px' : '2px' }}
            />
          </button>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Personalizar por lote
          </span>
        </div>
      )}

      {/* Batch selector (when per-lote) */}
      {perLoteCustom && batches.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => useWizardStore.getState().setActiveBatch(b.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: b.id === batch.id ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255,255,255,0.05)',
                border: b.id === batch.id ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: b.id === batch.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Objective */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Objetivo
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {OBJECTIVES.map((obj) => {
            const isSelected = config.objective === obj.value;
            return (
              <button
                key={obj.value}
                onClick={() => updateConfig({ objective: obj.value })}
                className="flex items-center gap-2 p-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span>{obj.icon}</span>
                <span className="text-sm" style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                  {obj.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Naming Tags System */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'rgba(57, 255, 20, 0.03)', border: '1px solid rgba(57, 255, 20, 0.1)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Nomenclatura (arraste para reordenar)
          </label>
          <button
            onClick={handleAddTextTag}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{ color: 'var(--color-accent)', border: '1px solid rgba(57, 255, 20, 0.3)' }}
          >
            + Texto customizado
          </button>
        </div>

        {/* Draggable tag chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {config.namingTags.map((tag) => (
            <div
              key={tag.id}
              draggable
              onDragStart={() => handleDragStart(tag.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(tag.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-grab active:cursor-grabbing transition-all"
              style={{
                backgroundColor: `${tag.color}20`,
                border: `1px solid ${tag.color}60`,
                color: tag.color,
              }}
            >
              <span className="select-none">{tag.label}</span>
              {(tag.type === 'text') && (
                <input
                  type="text"
                  value={tag.value}
                  onChange={(e) => updateNamingTag(batch.id, tag.id, e.target.value)}
                  placeholder="texto"
                  className="w-16 bg-transparent border-none outline-none text-xs"
                  style={{ color: tag.color }}
                />
              )}
              {(tag.type === 'text' || tag.type === 'sequence') && (
                <button
                  onClick={() => removeNamingTag(batch.id, tag.id)}
                  className="ml-0.5 opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Leva + Creative label inputs (legacy compat) */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Numero da Leva</label>
            <input
              type="text"
              value={config.namingPattern.levaNumber}
              onChange={(e) => updateNaming('levaNumber', e.target.value)}
              placeholder="08"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(57, 255, 20, 0.2)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Label do Criativo</label>
            <input
              type="text"
              value={config.namingPattern.creativeLabel}
              onChange={(e) => updateNaming('creativeLabel', e.target.value)}
              placeholder="Cr1"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(57, 255, 20, 0.2)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Preview */}
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(57, 255, 20, 0.1)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Preview do nome:</p>
          <p className="text-sm font-mono break-all" style={{ color: 'var(--color-accent)' }}>
            {namingPreview}
          </p>
        </div>
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Tipo de Orcamento
          </label>
          <div className="flex gap-2">
            {(['CBO', 'ABO'] as const).map((type) => (
              <button
                key={type}
                onClick={() => updateConfig({ budgetType: type })}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: config.budgetType === type ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: config.budgetType === type ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: config.budgetType === type ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Valor (centavos)
          </label>
          <input
            type="number"
            value={config.budgetValue}
            onChange={(e) => updateConfig({ budgetValue: Number(e.target.value) })}
            placeholder="5000"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(57, 255, 20, 0.2)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          {config.budgetValue > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              = R$ {budgetDisplay.toFixed(2)} por {config.budgetType === 'CBO' ? 'campanha' : 'adset'}
            </p>
          )}
        </div>
      </div>

      {/* Bid Strategy */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Estrategia de Lance
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BID_STRATEGIES.map((bs) => (
            <button
              key={bs.value}
              onClick={() => updateConfig({ bidStrategy: bs.value })}
              className="px-3 py-2 rounded-lg text-sm transition-all text-left"
              style={{
                backgroundColor: config.bidStrategy === bs.value ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255,255,255,0.02)',
                border: config.bidStrategy === bs.value ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: config.bidStrategy === bs.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              }}
            >
              {bs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Status Inicial
        </label>
        <div className="flex gap-2">
          {(['PAUSED', 'ACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => updateConfig({ campaignStatus: status })}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: config.campaignStatus === status ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.03)',
                border: config.campaignStatus === status ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: config.campaignStatus === status ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              }}
            >
              {status === 'PAUSED' ? 'Pausada' : 'Ativa'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
