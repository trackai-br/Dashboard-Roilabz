import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { validateWizardState } from '@/lib/validation';
import { supabase } from '@/lib/supabase';

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_SALES: 'Vendas',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_TRAFFIC: 'Trafego',
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_APP_PROMOTION: 'Instalacao de app',
};

const BID_LABELS: Record<string, string> = {
  LOWEST_COST_WITHOUT_CAP: 'Volume Mais Alto',
  LOWEST_COST_WITH_BID_CAP: 'Bid Cap',
  COST_CAP: 'Cost Cap',
  LOWEST_COST_WITH_MIN_ROAS: 'ROAS Minimo',
};

const EVENT_LABELS: Record<string, string> = {
  PURCHASE: 'Compra',
  LEAD: 'Lead',
  VIEW_CONTENT: 'Visita ao Perfil',
  ADD_TO_CART: 'Adicionar ao Carrinho',
  INITIATE_CHECKOUT: 'Iniciar Checkout',
  COMPLETE_REGISTRATION: 'Registro',
};

type SortKey = 'campaign' | 'account' | 'page' | 'adsets' | 'status';
type SortDir = 'asc' | 'desc';

interface PublishResult {
  campaignIndex: number;
  status: 'success' | 'failed';
  error?: string;
  meta_campaign_id?: string;
  campaignName?: string;
}

interface Tab6PreviewProps {
  onGoToTemplate?: () => void;
}

export default function Tab6Preview({ onGoToTemplate }: Tab6PreviewProps) {
  const { state, dispatch } = useWizard();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['campaign']));
  const [sortKey, setSortKey] = useState<SortKey>('campaign');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishJobId, setPublishJobId] = useState<string | null>(null);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [publishCompleted, setPublishCompleted] = useState(0);
  const [publishDone, setPublishDone] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = state.campaignConfig;
  const ad = state.adConfig;

  const totalAdsets = state.adsetTypes.reduce((s, t) => s + t.adsetCount * t.campaignsCount, 0);
  const totalCreatives = ad?.creativeFiles?.length ?? 0;
  const budgetDisplay = cfg.budgetValue / 100;
  const totalBudget = cfg.budgetType === 'CBO'
    ? budgetDisplay * state.totalCampaigns
    : budgetDisplay * totalAdsets;

  const validation = useMemo(() => validateWizardState(state), [state]);
  const warnings = useMemo(() => [
    ...validation.errors.map((e) => e.message),
    ...validation.warnings.map((w) => w.message),
  ], [validation]);

  const tableRows = useMemo(() => {
    return state.distributionMap.map((entry, i) => {
      const typesInCampaign = state.adsetTypes
        .filter((t) => t.campaignsCount > i || state.adsetTypes.length === 1)
        .map((t) => `${t.name || 'Sem nome'} (${t.adsetCount})`)
        .join(', ');
      const hasError = entry.adsetCount === 0;
      return {
        campaign: `CP ${String(entry.campaignIndex + 1).padStart(2, '0')}`,
        account: entry.accountId,
        page: entry.pageName,
        adsets: entry.adsetCount,
        types: typesInCampaign || '-',
        status: hasError ? 'error' : 'ok',
        errorMsg: hasError ? 'Nenhum adset alocado nesta campanha' : undefined,
      };
    });
  }, [state.distributionMap, state.adsetTypes]);

  const sortedRows = useMemo(() => {
    const rows = [...tableRows];
    rows.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return rows;
  }, [tableRows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // --- Publishing ---
  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/meta/publish-status/${jobId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      setPublishResults(data.results || []);
      setPublishCompleted(data.completedCampaigns || 0);

      if (data.status !== 'running') {
        setPublishDone(true);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handlePublish = async () => {
    setShowPublishModal(false);
    setIsPublishing(true);
    setPublishDone(false);
    setPublishResults([]);
    setPublishCompleted(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Nao autenticado');

      const res = await fetch('/api/meta/bulk-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          distribution: state.distributionMap,
          campaignConfig: state.campaignConfig,
          adsetTypes: state.adsetTypes,
          adConfig: state.adConfig,
        }),
      });

      if (!res.ok) throw new Error('Falha ao iniciar publicacao');
      const data = await res.json();
      setPublishJobId(data.jobId);

      // Start polling
      pollingRef.current = setInterval(() => pollStatus(data.jobId), 2000);
    } catch {
      setPublishDone(true);
      setPublishResults([{ campaignIndex: -1, status: 'failed', error: 'Falha ao iniciar publicacao' }]);
    }
  };

  const handleRetry = async (campaignIndex: number) => {
    if (!publishJobId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/meta/retry-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobId: publishJobId,
          campaignIndex,
          distribution: state.distributionMap,
          campaignConfig: state.campaignConfig,
          adsetTypes: state.adsetTypes,
          adConfig: state.adConfig,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPublishResults((prev) =>
          prev.map((r) => r.campaignIndex === campaignIndex ? data.result : r)
        );
      }
    } catch { /* ignore */ }
  };

  const handleRetryAll = () => {
    publishResults
      .filter((r) => r.status === 'failed')
      .forEach((r) => handleRetry(r.campaignIndex));
  };

  const successCount = publishResults.filter((r) => r.status === 'success').length;
  const failedCount = publishResults.filter((r) => r.status === 'failed').length;

  const headingFont = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };
  const formatCurrency = (v: number) => `R$ ${v.toFixed(2)}`;

  // --- PUBLISHING MODE ---
  if (isPublishing) {
    const total = state.distributionMap.length;
    const pct = total > 0 ? Math.round((publishCompleted / total) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-primary)', ...headingFont }}>
              {publishDone ? 'Publicacao Concluida' : `Publicando: ${publishCompleted} de ${total} campanhas`}
            </h3>
            <span className="text-sm font-bold" style={{ color: 'var(--neon-green)', ...headingFont }}>{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: 'var(--neon-green)', boxShadow: '0 0 8px rgba(57, 255, 20, 0.5)' }}
            />
          </div>
        </div>

        {/* Campaign list */}
        <div className="space-y-1.5">
          {state.distributionMap.map((entry) => {
            const result = publishResults.find((r) => r.campaignIndex === entry.campaignIndex);
            const cpName = `CP ${String(entry.campaignIndex + 1).padStart(2, '0')} - ${entry.accountId} - ${entry.pageName}`;

            let statusIcon = '\u23F3'; // hourglass
            let statusText = 'Aguardando';
            let statusColor = 'var(--color-tertiary)';

            if (result) {
              if (result.status === 'success') {
                statusIcon = '\u2705';
                statusText = `Publicada (ID: ${result.meta_campaign_id})`;
                statusColor = 'var(--neon-green)';
              } else {
                statusIcon = '\u274C';
                statusText = result.error || 'Erro';
                statusColor = 'var(--color-danger)';
              }
            } else if (!publishDone && publishCompleted >= entry.campaignIndex) {
              statusIcon = '\uD83D\uDD04';
              statusText = 'Publicando...';
              statusColor = 'var(--neon-cyan)';
            }

            return (
              <div key={entry.campaignIndex} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                <span className="text-sm">{statusIcon}</span>
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-primary)' }}>{cpName}</span>
                <span className="text-xs" style={{ color: statusColor }}>{statusText}</span>
                {result?.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(entry.campaignIndex)}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: 'rgba(255, 183, 3, 0.15)', color: '#ffb703', border: '1px solid rgba(255, 183, 3, 0.3)' }}
                  >
                    Retry
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Final summary */}
        {publishDone && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--neon-green)', ...headingFont }}>{successCount}</p>
                  <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>Publicadas</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: failedCount > 0 ? 'var(--color-danger)' : 'var(--color-tertiary)', ...headingFont }}>{failedCount}</p>
                  <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>Com erro</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--neon-green)', ...headingFont }}>{formatCurrency(totalBudget * (successCount / Math.max(total, 1)))}</p>
                  <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>Orcamento ativado</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              {failedCount > 0 && (
                <button
                  onClick={handleRetryAll}
                  className="px-5 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'rgba(255, 183, 3, 0.15)', color: '#ffb703', border: '1px solid rgba(255, 183, 3, 0.3)' }}
                >
                  Retry todas com erro
                </button>
              )}
              <button
                onClick={() => {
                  dispatch({ type: 'MARK_STEP_COMPLETE', payload: 5 });
                  if (onGoToTemplate) onGoToTemplate();
                  else dispatch({ type: 'SET_STEP', payload: 6 });
                }}
                className="px-5 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: 'var(--neon-green)', color: 'var(--bg-deepest)' }}
              >
                Continuar para Template
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- NORMAL PREVIEW MODE ---
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard icon={<MoneyIcon />} label="Orcamento Total" value={formatCurrency(totalBudget)} highlight />
        <SummaryCard icon={<MegaphoneIcon />} label="Campanhas" value={String(state.totalCampaigns)} />
        <SummaryCard icon={<LayersIcon />} label="Adsets" value={String(totalAdsets)} />
        <SummaryCard icon={<ImageIcon />} label="Criativos" value={String(totalCreatives)} />
        <SummaryCard icon={<UserIcon />} label="Contas Ativas" value={String(state.selectedAccountIds.length)} />
        <SummaryCard icon={<BuildingIcon />} label="Paginas" value={String(state.selectedPageIds.length)} />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)', color: '#ffb703' }}>
              <span className="flex-shrink-0 mt-0.5">&#9888;&#65039;</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Distribution Table */}
      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary)', ...headingFont }}>Tabela de Distribuicao</h3>
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                {([['campaign', 'Campanha'], ['account', 'Conta'], ['page', 'Pagina'], ['adsets', 'Adsets'], ['status', 'Status']] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key)} className="px-3 py-2 text-left cursor-pointer select-none whitespace-nowrap" style={{ color: 'var(--color-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-light)' }}>
                    {label}
                    {sortKey === key && <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                  </th>
                ))}
                <th className="px-3 py-2 text-left" style={{ color: 'var(--color-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-light)' }}>Tipos de Adset</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-center" style={{ color: 'var(--color-tertiary)' }}>Nenhuma distribuicao configurada</td></tr>
              )}
              {sortedRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td className="px-3 py-2" style={{ color: 'var(--color-primary)' }}>{row.campaign}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--color-secondary)' }}>{row.account}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--color-secondary)' }}>{row.page}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--neon-cyan)' }}>{row.adsets}</td>
                  <td className="px-3 py-2">
                    {row.status === 'ok'
                      ? <span style={{ color: 'var(--neon-green)' }} title="Pronto">&#10003; Pronto</span>
                      : <span style={{ color: 'var(--color-danger)' }} title={row.errorMsg}>&#10007; Erro</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--color-tertiary)' }}>{row.types}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Accordions */}
      <div className="space-y-2">
        <AccordionSection id="campaign" title="Configuracoes - Campanha" open={openSections.has('campaign')} onToggle={() => toggleSection('campaign')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Objetivo" value={OBJECTIVE_LABELS[cfg.objective] || cfg.objective} />
            <InfoRow label="Naming" value={`LEVA ${cfg.namingPattern.levaNumber} / ${cfg.namingPattern.creativeLabel}`} />
            <InfoRow label="Orcamento" value={`${cfg.budgetType} - ${formatCurrency(budgetDisplay)} por ${cfg.budgetType === 'CBO' ? 'campanha' : 'adset'}`} />
            <InfoRow label="Estrategia de Lance" value={BID_LABELS[cfg.bidStrategy] || cfg.bidStrategy} />
            <InfoRow label="Status" value={cfg.campaignStatus === 'ACTIVE' ? 'Ativa' : 'Pausada'} />
          </div>
        </AccordionSection>

        <AccordionSection id="adset" title="Configuracoes - Adsets" open={openSections.has('adset')} onToggle={() => toggleSection('adset')}>
          {state.adsetTypes.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-tertiary)' }}>Nenhum tipo de adset configurado.</p>
          ) : (
            <div className="space-y-3">
              {state.adsetTypes.map((t) => (
                <div key={t.id} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--neon-cyan)' }}>{t.name || 'Sem nome'} - {t.adsetCount} adsets x {t.campaignsCount} campanhas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <InfoRow label="Criativos" value={t.creativesInAdset.filter(Boolean).join(', ') || '-'} small />
                    <InfoRow label="Evento" value={EVENT_LABELS[t.conversionEvent] || t.conversionEvent} small />
                    <InfoRow label="Pixel" value={t.pixelId || '-'} small />
                    <InfoRow label="Data inicio" value={t.startDate} small />
                    <InfoRow label="Paises" value={t.targetCountries.join(', ')} small />
                    <InfoRow label="Status" value={t.adsetStatus === 'ACTIVE' ? 'Ativo' : 'Pausado'} small />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>

        <AccordionSection id="ad" title="Configuracoes - Anuncios" open={openSections.has('ad')} onToggle={() => toggleSection('ad')}>
          {!ad ? (
            <p className="text-sm" style={{ color: 'var(--color-tertiary)' }}>Anuncio nao configurado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <InfoRow label="URL" value={ad.destinationUrl || '-'} />
              <InfoRow label="Formato" value={ad.creativeFormat} />
              <InfoRow label="Criativos" value={`${ad.creativeFiles.length} arquivo(s)`} />
              <InfoRow label="Titulo" value={ad.headline || '-'} />
              <InfoRow label="Texto" value={ad.primaryText ? (ad.primaryText.length > 60 ? ad.primaryText.slice(0, 60) + '...' : ad.primaryText) : '-'} />
              <InfoRow label="Descricao" value={ad.description || '-'} />
              {ad.utmParams.utm_source && <InfoRow label="UTM Source" value={ad.utmParams.utm_source} />}
              {ad.utmParams.utm_medium && <InfoRow label="UTM Medium" value={ad.utmParams.utm_medium} />}
              {ad.utmParams.utm_campaign && <InfoRow label="UTM Campaign" value={ad.utmParams.utm_campaign} />}
            </div>
          )}
        </AccordionSection>
      </div>

      {/* Publish Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => setShowPublishModal(true)}
          className="px-8 py-3 rounded-xl text-base font-bold transition-all"
          style={{
            backgroundColor: 'var(--neon-green)',
            color: 'var(--bg-deepest)',
            ...headingFont,
            letterSpacing: '0.04em',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.4)',
          }}
        >
          Publicar Campanhas
        </button>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishModal && (() => {
        const isActive = cfg.campaignStatus === 'ACTIVE';
        const adsetStatuses = state.adsetTypes.map((t) => t.adsetStatus);
        const hasActiveAdsets = adsetStatuses.includes('ACTIVE');
        const willSpendMoney = isActive && hasActiveAdsets;

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowPublishModal(false)} />
            <div className="relative rounded-xl p-6 border shadow-xl max-w-lg w-full" style={{ backgroundColor: '#1a1a2e', borderColor: willSpendMoney ? 'rgba(255, 51, 51, 0.5)' : 'rgba(57, 255, 20, 0.3)' }}>
              <p className="text-lg font-bold mb-3" style={{ color: 'var(--color-primary)', ...headingFont }}>
                Confirmar Publicacao
              </p>

              {/* Warning banner for ACTIVE campaigns */}
              {willSpendMoney && (
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255, 51, 51, 0.12)', border: '1px solid rgba(255, 51, 51, 0.4)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#ff5555' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Campanhas com status ATIVO
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255, 85, 85, 0.9)' }}>
                    As campanhas serao criadas <strong>ATIVAS</strong> e vao comecar a gastar dinheiro imediatamente apos a publicacao.
                  </p>
                </div>
              )}

              {!willSpendMoney && (
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                  <p className="text-sm" style={{ color: 'var(--neon-cyan)' }}>
                    As campanhas serao criadas <strong>PAUSADAS</strong>. Nenhum gasto sera feito ate voce ativa-las manualmente no Meta Ads Manager.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-secondary)' }}>Campanhas</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{state.totalCampaigns}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-secondary)' }}>Adsets totais</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{totalAdsets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-secondary)' }}>Contas</span>
                  <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{state.selectedAccountIds.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-secondary)' }}>Orcamento diario total</span>
                  <span className="font-bold" style={{ color: willSpendMoney ? '#ff5555' : 'var(--neon-green)' }}>{formatCurrency(totalBudget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-secondary)' }}>Status das campanhas</span>
                  <span className="font-semibold" style={{ color: isActive ? '#ff5555' : 'var(--neon-cyan)' }}>
                    {isActive ? 'ATIVO' : 'PAUSADO'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t" style={{ borderTopColor: 'var(--border-light)' }}>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-5 py-2.5 rounded-lg border text-sm font-medium"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--color-secondary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePublish}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: willSpendMoney ? '#ff5555' : 'var(--neon-green)',
                    color: willSpendMoney ? '#fff' : 'var(--bg-deepest)',
                    ...headingFont,
                    boxShadow: willSpendMoney ? '0 0 16px rgba(255, 51, 51, 0.4)' : '0 0 12px rgba(57, 255, 20, 0.3)',
                  }}
                >
                  {willSpendMoney ? 'Publicar e Ativar' : 'Publicar Pausado'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// --- Sub-components ---

function SummaryCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-lg border text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: highlight ? 'rgba(57, 255, 20, 0.3)' : 'var(--border-light)' }}>
      <div className="mb-1.5" style={{ color: highlight ? 'var(--neon-green)' : 'var(--color-secondary)' }}>{icon}</div>
      <p className="text-lg font-bold" style={{ color: highlight ? 'var(--neon-green)' : 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif", textShadow: highlight ? '0 0 8px rgba(57, 255, 20, 0.3)' : 'none' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-tertiary)' }}>{label}</p>
    </div>
  );
}

function AccordionSection({ id, title, open, onToggle, children }: { id: string; title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: open ? 'rgba(57, 255, 20, 0.2)' : 'var(--border-light)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-4 py-3 text-left">
        <svg width="16" height="16" className="w-4 h-4 transition-transform flex-shrink-0" style={{ color: 'var(--color-secondary)', transform: open ? 'rotate(90deg)' : 'rotate(0)' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>{title}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderTopColor: 'var(--border-light)' }}>
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>{label}: </span>
      <span className={small ? 'text-xs' : 'text-sm'} style={{ color: 'var(--color-primary)' }}>{value}</span>
    </div>
  );
}

// --- Icons ---
function MoneyIcon() { return <svg width="20" height="20" className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function MegaphoneIcon() { return <svg width="20" height="20" className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>; }
function LayersIcon() { return <svg width="20" height="20" className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>; }
function ImageIcon() { return <svg width="20" height="20" className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zm16.5-13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>; }
function UserIcon() { return <svg width="20" height="20" className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>; }
function BuildingIcon() { return <svg width="20" height="20" className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>; }
