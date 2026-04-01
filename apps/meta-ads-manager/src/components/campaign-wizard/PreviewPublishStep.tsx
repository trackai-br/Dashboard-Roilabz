import React, { useMemo, useCallback, useEffect } from 'react';
import { useWizardStore, selectBatches, selectCreativePool, selectAdConfig } from '@/stores/wizard-store';
import type { PublishBatchResult, BatchConfig } from '@/stores/wizard-store';
import { authenticatedFetch } from '@/lib/api-client';
import { validateAllBatches } from '@/lib/batch-schemas';
import { calculateCampaignsPerType } from '@/lib/distribution';

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
  const updateChecklistItem = useWizardStore((s) => s.updateChecklistItem);

  // Mark review as complete when this step is visited
  useEffect(() => {
    updateChecklistItem('review', true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: total de adsets de um batch usando distribuição em blocos
  const calcBatchAdsets = (b: BatchConfig) => {
    const blocks = calculateCampaignsPerType(b.totalCampaigns, b.adsetTypes.length);
    return b.adsetTypes.reduce((a, t, i) => a + t.adsetCount * blocks[i], 0);
  };

  // KPIs
  const totalCampaigns = batches.reduce((s, b) => s + b.totalCampaigns, 0);
  const totalAdsets = batches.reduce((s, b) => s + calcBatchAdsets(b), 0);
  const totalCreatives = creativePool.length;
  const totalAccounts = new Set(batches.flatMap((b) => b.accounts.map((a) => a.accountId))).size;
  const totalPages = new Set(batches.flatMap((b) => b.pages.map((p) => p.pageId))).size;
  const totalBudget = batches.reduce((s, b) => {
    const budgetPer = b.campaignConfig.budgetValue / 100;
    return s + (b.campaignConfig.budgetType === 'CBO'
      ? budgetPer * b.totalCampaigns
      : budgetPer * calcBatchAdsets(b));
  }, 0);

  // Zod batch validation — errors block publication
  const batchValidation = useMemo(() => validateAllBatches(batches), [batches]);

  // Warnings — ad-level issues and Zod warnings (do not block publication on their own)
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!adConfig?.destinationUrl) w.push('URL de destino nao definida');
    if (!adConfig?.primaryText) w.push('Texto principal vazio');
    if (totalCreatives === 0) w.push('Nenhum criativo selecionado');

    return w;
  }, [adConfig, totalCreatives, batches]);

  // Per-batch Zod warnings (budget, ROAS) — computed separately to avoid circular import issues
  const batchWarnings = useMemo(() => {
    const w: string[] = [];
    batches.forEach((b) => {
      const budgetPer = b.campaignConfig.budgetValue / 100;
      const totalB = b.campaignConfig.budgetType === 'CBO'
        ? budgetPer * b.totalCampaigns
        : budgetPer * calcBatchAdsets(b);
      if (totalB > 50000) w.push(`Lote "${b.name}": orcamento total R$ ${totalB.toFixed(2)} excede R$ 50.000`);
      if (b.campaignConfig.bidStrategy === 'LOWEST_COST_WITH_MIN_ROAS') {
        w.push(`Lote "${b.name}": estrategia ROAS minimo nao suportada`);
      }
    });
    return w;
  }, [batches]);

  const canPublish = batchValidation.isValid && warnings.length === 0;

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
              adConfig: { ...adConfig, creativeFiles: creativePool },
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
          adConfig: { ...adConfig, creativeFiles: creativePool },
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
          {
            label: 'Campanhas', value: totalCampaigns,
            icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
          },
          {
            label: 'Adsets', value: totalAdsets,
            icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M3 9h18M3 15h18" /></svg>,
          },
          {
            label: 'Criativos', value: totalCreatives,
            icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
          },
          {
            label: 'Contas', value: totalAccounts,
            icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
          },
          {
            label: 'Paginas', value: totalPages,
            icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
          },
          {
            label: 'Orcamento Total', value: `R$ ${totalBudget.toFixed(2)}`,
            icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-3 rounded-xl text-center"
            style={{
              backgroundColor: 'var(--color-bg-surface-hover)',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex justify-center mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {kpi.icon}
            </div>
            <p
              className="text-lg font-bold font-mono"
              style={{ color: 'var(--color-accent)' }}
            >
              {kpi.value}
            </p>
            <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Validation Errors — block publication */}
      {!batchValidation.isValid && (
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.4)' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-danger)' }}>
            Erros de validacao — corrija antes de publicar
          </p>
          {batchValidation.batchErrors.map(({ batchIndex, errors }) => (
            <div key={batchIndex} className="mb-1">
              <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
                Lote {batchIndex + 1}: {batches[batchIndex]?.name}
              </p>
              {Object.values(errors).map((msg, i) => (
                <p key={i} className="text-xs pl-2" style={{ color: 'var(--color-danger)' }}>
                  • {msg}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Warnings — informational */}
      {(warnings.length > 0 || batchWarnings.length > 0) && (
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 183, 3, 0.08)', border: '1px solid rgba(255, 183, 3, 0.3)' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-warning)' }}>
            Avisos ({warnings.length + batchWarnings.length})
          </p>
          {[...warnings, ...batchWarnings].map((w, i) => (
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
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
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
                style={{ border: '1px solid var(--color-border)' }}
              >
                {/* Batch header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ backgroundColor: 'var(--color-bg-sidebar)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {batch.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      backgroundColor: 'rgba(22, 163, 74, 0.1)',
                      color: 'var(--color-accent-bright)',
                    }}>
                      {batch.totalCampaigns} camp · {batch.accounts.length} contas · {batch.pages.length} pag
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {OBJECTIVE_LABELS[batch.campaignConfig.objective] || batch.campaignConfig.objective}
                    {' · '}R$ {(batch.campaignConfig.budgetValue / 100).toFixed(2)} {batch.campaignConfig.budgetType}
                  </span>
                </div>

                {/* Batch detail rows */}
                <div className="px-4 py-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: 'var(--color-text-tertiary)' }}>
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
                            <td className="py-1" style={{ color: 'var(--color-text-secondary)' }}>{acc.accountName}</td>
                            <td className="py-1" style={{ color: 'var(--color-text-secondary)' }}>{page.pageName}</td>
                            <td className="py-1 text-right" style={{ color: 'var(--color-text-primary)' }}>
                              {batch.adsetTypes.reduce((s, t) => s + t.adsetCount, 0)}
                            </td>
                            <td className="py-1 text-center">
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: batch.campaignConfig.campaignStatus === 'PAUSED' ? 'var(--color-warning-bg)' : 'rgba(22, 163, 74, 0.1)',
                                  color: batch.campaignConfig.campaignStatus === 'PAUSED' ? 'var(--color-warning)' : 'var(--color-accent-bright)',
                                }}
                              >
                                {batch.campaignConfig.campaignStatus === 'PAUSED' ? 'Pausado' : 'Ativo'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Per-batch progress bar */}
                {batchPublish && (
                  <div className="px-4 py-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{
                        color: batchPublish.status === 'completed' ? 'var(--color-success)'
                          : batchPublish.status === 'failed' ? 'var(--color-danger)'
                          : batchPublish.status === 'publishing' ? 'var(--color-accent)'
                          : 'var(--color-text-tertiary)',
                      }}>
                        {batchPublish.status === 'pending' && 'Aguardando...'}
                        {batchPublish.status === 'publishing' && `Publicando ${batchPublish.completedCampaigns}/${batchPublish.totalCampaigns}...`}
                        {batchPublish.status === 'completed' && `Concluido (${batchPublish.completedCampaigns}/${batchPublish.totalCampaigns})`}
                        {batchPublish.status === 'failed' && 'Falhou'}
                      </span>
                      {batchPublish.status === 'failed' && (
                        <button
                          onClick={() => handleRetryBatch(batch.id)}
                          className="text-xs px-2 py-0.5 rounded-lg cursor-pointer focus:outline-none"
                          style={{
                            color: 'var(--color-accent)',
                            border: '1px solid rgba(22, 163, 74, 0.35)',
                            transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        >
                          Tentar novamente
                        </button>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${batchPublish.totalCampaigns > 0 ? (batchPublish.completedCampaigns / batchPublish.totalCampaigns) * 100 : 0}%`,
                          backgroundColor: batchPublish.status === 'failed' ? 'var(--color-danger)' : 'var(--color-accent)',
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
          disabled={isPublishing || !canPublish}
          className="btn-brand w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:filter-none"
        >
          {isPublishing ? 'Publicando...' : `Publicar ${totalCampaigns} campanhas em ${batches.length} lote${batches.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Template Save (post-publish) */}
      {publishDone && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
        >
          <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Salvar como Template
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nome do template..."
              className="input flex-1 text-sm"
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="btn-brand px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:filter-none"
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
