import React, { useMemo, useCallback } from 'react';
import { useWizardStore, selectBatches, selectCreativePool, selectAdConfig } from '@/stores/wizard-store';
import type { PublishBatchResult, BatchConfig } from '@/stores/wizard-store';
import { authenticatedFetch } from '@/lib/api-client';

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_SALES: 'Vendas',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_TRAFFIC: 'Trafego',
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_APP_PROMOTION: 'Instalacao de app',
};

interface PreviewPublishStepProps {
  onSaved?: () => void;
}

export default function PreviewPublishStep({ onSaved }: PreviewPublishStepProps) {
  const batches = useWizardStore(selectBatches);
  const creativePool = useWizardStore(selectCreativePool);
  const adConfig = useWizardStore(selectAdConfig);
  const distributionMode = useWizardStore((s) => s.distributionMode);
  const publishState = useWizardStore((s) => s.publishState);
  const isPublishing = useWizardStore((s) => s.isPublishing);
  const setPublishState = useWizardStore((s) => s.setPublishState);
  const updatePublishBatch = useWizardStore((s) => s.updatePublishBatch);
  const setIsPublishing = useWizardStore((s) => s.setIsPublishing);
  const setTemplateName = useWizardStore((s) => s.setTemplateName);
  const templateName = useWizardStore((s) => s.templateName);

  // KPIs
  const totalCampaigns = batches.reduce((s, b) => s + b.totalCampaigns, 0);
  const totalAdsets = batches.reduce((s, b) => s + b.adsetTypes.reduce((a, t) => a + t.adsetCount * t.campaignsCount, 0), 0);
  const totalCreatives = creativePool.length;
  const totalAccounts = new Set(batches.flatMap((b) => b.accounts.map((a) => a.accountId))).size;
  const totalPages = new Set(batches.flatMap((b) => b.pages.map((p) => p.pageId))).size;
  const totalBudget = batches.reduce((s, b) => {
    const budgetPer = b.campaignConfig.budgetValue / 100;
    return s + (b.campaignConfig.budgetType === 'CBO'
      ? budgetPer * b.totalCampaigns
      : budgetPer * b.adsetTypes.reduce((a, t) => a + t.adsetCount * t.campaignsCount, 0));
  }, 0);

  // Warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!adConfig?.destinationUrl) w.push('URL de destino nao definida');
    if (!adConfig?.primaryText) w.push('Texto principal vazio');
    if (totalCreatives === 0) w.push('Nenhum criativo selecionado');
    batches.forEach((b) => {
      if (b.accounts.length === 0) w.push(`Lote "${b.name}": sem contas`);
      if (b.pages.length === 0) w.push(`Lote "${b.name}": sem paginas`);
      if (b.adsetTypes.length === 0) w.push(`Lote "${b.name}": sem tipos de adset`);
      if (b.campaignConfig.budgetValue <= 0) w.push(`Lote "${b.name}": orcamento zerado`);
    });
    return w;
  }, [adConfig, totalCreatives, batches]);

  // Publish per batch
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);

    try {
      // Initialize publish state
      const initialState: PublishBatchResult[] = batches.map((b) => ({
        batchId: b.id,
        batchName: b.name,
        status: 'pending',
        results: [],
        completedCampaigns: 0,
        totalCampaigns: b.totalCampaigns,
      }));
      setPublishState(initialState);

      // Iterate batches sequentially
      for (const batch of batches) {
        updatePublishBatch(batch.id, { status: 'publishing' });

        try {
          // Build distribution map for this batch
          const distribution = buildDistributionMap(batch);

          const res = await authenticatedFetch('/api/meta/bulk-publish', {
            method: 'POST',
            body: JSON.stringify({
              distribution,
              campaignConfig: batch.campaignConfig,
              adsetTypes: batch.adsetTypes,
              adConfig,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            updatePublishBatch(batch.id, {
              status: 'failed',
              results: [{ campaignIndex: 0, status: 'failed', error: errData.error || 'Erro HTTP' }],
            });
            continue;
          }

          const data = await res.json();
          updatePublishBatch(batch.id, {
            status: 'completed',
            results: data.results || [],
            completedCampaigns: data.completedCampaigns || 0,
            jobId: data.jobId,
          });
        } catch (err: any) {
          updatePublishBatch(batch.id, {
            status: 'failed',
            results: [{ campaignIndex: 0, status: 'failed', error: err.message }],
          });
        }
      }
    } finally {
      setIsPublishing(false);
    }
  }, [batches, adConfig, isPublishing, setIsPublishing, setPublishState, updatePublishBatch]);

  // Retry a single batch
  const handleRetryBatch = useCallback(async (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    updatePublishBatch(batchId, { status: 'publishing', results: [], completedCampaigns: 0 });

    try {
      const distribution = buildDistributionMap(batch);
      const res = await authenticatedFetch('/api/meta/bulk-publish', {
        method: 'POST',
        body: JSON.stringify({
          distribution,
          campaignConfig: batch.campaignConfig,
          adsetTypes: batch.adsetTypes,
          adConfig,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        updatePublishBatch(batchId, {
          status: 'failed',
          results: [{ campaignIndex: 0, status: 'failed', error: errData.error || 'Erro HTTP' }],
        });
        return;
      }

      const data = await res.json();
      updatePublishBatch(batchId, {
        status: 'completed',
        results: data.results || [],
        completedCampaigns: data.completedCampaigns || 0,
        jobId: data.jobId,
      });
    } catch (err: any) {
      updatePublishBatch(batchId, {
        status: 'failed',
        results: [{ campaignIndex: 0, status: 'failed', error: err.message }],
      });
    }
  }, [batches, adConfig, updatePublishBatch]);

  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim()) return;
    try {
      await authenticatedFetch('/api/templates/save', {
        method: 'POST',
        body: JSON.stringify({
          name: templateName,
          state: useWizardStore.getState(),
        }),
      });
      onSaved?.();
    } catch (err) {
      // silent
    }
  }, [templateName, onSaved]);

  const publishDone = publishState.length > 0 && publishState.every((p) => p.status === 'completed' || p.status === 'failed');
  const allSuccess = publishState.length > 0 && publishState.every((p) => p.status === 'completed');

  return (
    <div className="space-y-6">
      {/* KPI Cards — 2x3 grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Campanhas', value: totalCampaigns, icon: '📊' },
          { label: 'Adsets', value: totalAdsets, icon: '🎯' },
          { label: 'Criativos', value: totalCreatives, icon: '🖼️' },
          { label: 'Contas', value: totalAccounts, icon: '👤' },
          { label: 'Paginas', value: totalPages, icon: '📄' },
          { label: 'Orcamento Total', value: `R$ ${totalBudget.toFixed(2)}`, icon: '💰' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-3 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(57, 255, 20, 0.04)',
              border: '1px solid rgba(57, 255, 20, 0.12)',
            }}
          >
            <span className="text-lg">{kpi.icon}</span>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--neon-green)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              {kpi.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 183, 3, 0.08)', border: '1px solid rgba(255, 183, 3, 0.3)' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-warning)' }}>
            Avisos ({warnings.length})
          </p>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs" style={{ color: 'var(--color-warning)' }}>
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* Distribution Table by Lote */}
      <div>
        <h4
          className="text-sm font-bold mb-3"
          style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          Distribuicao por Lote
        </h4>
        <div className="space-y-3">
          {batches.map((batch) => {
            const batchPublish = publishState.find((p) => p.batchId === batch.id);
            return (
              <div
                key={batch.id}
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(57, 255, 20, 0.1)' }}
              >
                {/* Batch header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ backgroundColor: 'rgba(57, 255, 20, 0.04)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                      {batch.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      backgroundColor: 'rgba(57, 255, 20, 0.1)',
                      color: 'var(--neon-green)',
                    }}>
                      {batch.totalCampaigns} camp · {batch.accounts.length} contas · {batch.pages.length} pag
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
                    {OBJECTIVE_LABELS[batch.campaignConfig.objective] || batch.campaignConfig.objective}
                    {' · '}R$ {(batch.campaignConfig.budgetValue / 100).toFixed(2)} {batch.campaignConfig.budgetType}
                  </span>
                </div>

                {/* Batch detail rows */}
                <div className="px-4 py-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: 'var(--color-tertiary)' }}>
                        <th className="text-left py-1">Conta</th>
                        <th className="text-left py-1">Pagina</th>
                        <th className="text-right py-1">Adsets</th>
                        <th className="text-center py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.accounts.map((acc) =>
                        batch.pages.map((page) => (
                          <tr key={`${acc.accountId}-${page.pageId}`}>
                            <td className="py-1" style={{ color: 'var(--color-secondary)' }}>{acc.accountName}</td>
                            <td className="py-1" style={{ color: 'var(--color-secondary)' }}>{page.pageName}</td>
                            <td className="py-1 text-right" style={{ color: 'var(--color-primary)' }}>
                              {batch.adsetTypes.reduce((s, t) => s + t.adsetCount, 0)}
                            </td>
                            <td className="py-1 text-center" style={{ color: 'var(--color-tertiary)' }}>
                              {batch.campaignConfig.campaignStatus === 'PAUSED' ? '⏸️' : '▶️'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Per-batch progress bar */}
                {batchPublish && (
                  <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(57, 255, 20, 0.08)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{
                        color: batchPublish.status === 'completed' ? 'var(--color-success)'
                          : batchPublish.status === 'failed' ? 'var(--color-danger)'
                          : batchPublish.status === 'publishing' ? 'var(--neon-green)'
                          : 'var(--color-tertiary)',
                      }}>
                        {batchPublish.status === 'pending' && 'Aguardando...'}
                        {batchPublish.status === 'publishing' && `Publicando ${batchPublish.completedCampaigns}/${batchPublish.totalCampaigns}...`}
                        {batchPublish.status === 'completed' && `Concluido (${batchPublish.completedCampaigns}/${batchPublish.totalCampaigns})`}
                        {batchPublish.status === 'failed' && 'Falhou'}
                      </span>
                      {batchPublish.status === 'failed' && (
                        <button
                          onClick={() => handleRetryBatch(batch.id)}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ color: 'var(--neon-green)', border: '1px solid rgba(57, 255, 20, 0.3)' }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${batchPublish.totalCampaigns > 0 ? (batchPublish.completedCampaigns / batchPublish.totalCampaigns) * 100 : 0}%`,
                          backgroundColor: batchPublish.status === 'failed' ? 'var(--color-danger)' : 'var(--neon-green)',
                        }}
                      />
                    </div>
                    {/* Error details */}
                    {batchPublish.results.filter((r) => r.status === 'failed').map((r, i) => (
                      <p key={i} className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
                        CP {String(r.campaignIndex + 1).padStart(2, '0')}: {r.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Publish Button */}
      {!publishDone && (
        <button
          onClick={handlePublish}
          disabled={isPublishing || warnings.length > 0}
          className="w-full py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
          style={{
            backgroundColor: 'var(--neon-green)',
            color: 'var(--bg-deepest)',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
          }}
        >
          {isPublishing ? 'Publicando...' : `Publicar ${totalCampaigns} campanhas em ${batches.length} lote${batches.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Template Save (post-publish) */}
      {publishDone && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'rgba(57, 255, 20, 0.04)', border: '1px solid rgba(57, 255, 20, 0.15)' }}
        >
          <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
            Salvar como Template
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nome do template..."
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(57, 255, 20, 0.2)',
                color: 'var(--color-primary)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--neon-green)',
                color: 'var(--bg-deepest)',
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Build distribution map from batch config (maps accounts x pages x campaigns)
function buildDistributionMap(batch: BatchConfig) {
  const entries: any[] = [];
  let campaignIndex = 0;
  for (const account of batch.accounts) {
    for (const page of batch.pages) {
      for (let i = 0; i < batch.totalCampaigns; i++) {
        entries.push({
          campaignIndex: campaignIndex++,
          accountId: account.accountId,
          accountName: account.accountName,
          pageId: page.pageId,
          pageName: page.pageName,
          adsetCount: batch.adsetsPerCampaign,
        });
      }
    }
  }
  return entries;
}
