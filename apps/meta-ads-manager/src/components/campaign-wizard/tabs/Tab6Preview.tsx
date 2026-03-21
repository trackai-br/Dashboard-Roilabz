import React, { useState, useMemo } from 'react';
import { useWizard } from '@/contexts/WizardContext';

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_SALES: 'Vendas',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_TRAFFIC: 'Tráfego',
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_APP_PROMOTION: 'Instalação de app',
};

const BID_LABELS: Record<string, string> = {
  LOWEST_COST_WITHOUT_CAP: 'Volume Mais Alto',
  LOWEST_COST_WITH_BID_CAP: 'Bid Cap',
  COST_CAP: 'Cost Cap',
  LOWEST_COST_WITH_MIN_ROAS: 'ROAS Mínimo',
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

export default function Tab6Preview() {
  const { state, dispatch } = useWizard();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [published, setPublished] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['campaign']));
  const [sortKey, setSortKey] = useState<SortKey>('campaign');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const cfg = state.campaignConfig;
  const ad = state.adConfig;

  // --- Computed metrics ---
  const totalAdsets = state.adsetTypes.reduce((s, t) => s + t.adsetCount * t.campaignsCount, 0);
  const totalCreatives = ad?.creativeFiles?.length ?? 0;
  const budgetDisplay = cfg.budgetValue / 100;
  const totalBudget = cfg.budgetType === 'CBO'
    ? budgetDisplay * state.totalCampaigns
    : budgetDisplay * totalAdsets;

  // --- Warnings ---
  const warnings = useMemo(() => {
    const w: string[] = [];
    const programmed = state.adsetsPerCampaign * state.totalCampaigns;
    if (totalAdsets !== programmed) {
      w.push(`Total de adsets dos tipos (${totalAdsets}) \u2260 total programado (${programmed})`);
    }
    if (ad) {
      const adsetCreativeNames = new Set(state.adsetTypes.flatMap((t) => t.creativesInAdset));
      const fileNames = new Set(ad.creativeFiles.map((f) => f.fileName));
      for (const name of adsetCreativeNames) {
        if (name && !fileNames.has(name)) {
          w.push(`Criativo "${name}" referenciado nos adsets mas não encontrado nos arquivos`);
        }
      }
    }
    if (!ad?.destinationUrl) {
      w.push('URL de destino não configurada na Tab Anúncios');
    }
    return w;
  }, [state, ad, totalAdsets]);

  // --- Distribution table ---
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

  const handlePublish = () => {
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: 5 });
    setPublished(true);
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: '10px',
    padding: '16px',
  };

  const headingFont = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SummaryCard
          icon={<MoneyIcon />}
          label="Orçamento Total"
          value={formatCurrency(totalBudget)}
          highlight
        />
        <SummaryCard
          icon={<MegaphoneIcon />}
          label="Campanhas"
          value={String(state.totalCampaigns)}
        />
        <SummaryCard
          icon={<LayersIcon />}
          label="Adsets"
          value={String(totalAdsets)}
        />
        <SummaryCard
          icon={<ImageIcon />}
          label="Criativos"
          value={String(totalCreatives)}
        />
        <SummaryCard
          icon={<UserIcon />}
          label="Contas Ativas"
          value={String(state.selectedAccountIds.length)}
        />
        <SummaryCard
          icon={<BuildingIcon />}
          label="Páginas"
          value={String(state.selectedPageIds.length)}
        />
      </div>

      {/* --- Warnings --- */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)', color: '#ffb703' }}
            >
              <span className="flex-shrink-0 mt-0.5">&#9888;&#65039;</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* --- Distribution Table --- */}
      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary)', ...headingFont }}>
          Tabela de Distribuição
        </h3>
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-light)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                {([
                  ['campaign', 'Campanha'],
                  ['account', 'Conta'],
                  ['page', 'Página'],
                  ['adsets', 'Adsets'],
                  ['status', 'Status'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-3 py-2 text-left cursor-pointer select-none whitespace-nowrap"
                    style={{ color: 'var(--color-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-light)' }}
                  >
                    {label}
                    {sortKey === key && (
                      <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                    )}
                  </th>
                ))}
                <th className="px-3 py-2 text-left" style={{ color: 'var(--color-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border-light)' }}>
                  Tipos de Adset
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center" style={{ color: 'var(--color-tertiary)' }}>
                    Nenhuma distribuição configurada
                  </td>
                </tr>
              )}
              {sortedRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td className="px-3 py-2" style={{ color: 'var(--color-primary)' }}>{row.campaign}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--color-secondary)' }}>{row.account}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--color-secondary)' }}>{row.page}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--neon-cyan)' }}>{row.adsets}</td>
                  <td className="px-3 py-2">
                    {row.status === 'ok' ? (
                      <span style={{ color: 'var(--neon-green)' }} title="Pronto">&#10003; Pronto</span>
                    ) : (
                      <span style={{ color: 'var(--color-danger)' }} title={row.errorMsg}>&#10007; Erro</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--color-tertiary)' }}>{row.types}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Config Accordions --- */}
      <div className="space-y-2">
        {/* Campaign Level */}
        <AccordionSection
          id="campaign"
          title="Configurações - Campanha"
          open={openSections.has('campaign')}
          onToggle={() => toggleSection('campaign')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Objetivo" value={OBJECTIVE_LABELS[cfg.objective] || cfg.objective} />
            <InfoRow label="Naming" value={`LEVA ${cfg.namingPattern.levaNumber} / ${cfg.namingPattern.creativeLabel}`} />
            <InfoRow label="Orçamento" value={`${cfg.budgetType} - ${formatCurrency(budgetDisplay)} por ${cfg.budgetType === 'CBO' ? 'campanha' : 'adset'}`} />
            <InfoRow label="Estratégia de Lance" value={BID_LABELS[cfg.bidStrategy] || cfg.bidStrategy} />
            <InfoRow label="Status" value={cfg.campaignStatus === 'ACTIVE' ? 'Ativa' : 'Pausada'} />
          </div>
        </AccordionSection>

        {/* Adset Level */}
        <AccordionSection
          id="adset"
          title="Configurações - Adsets"
          open={openSections.has('adset')}
          onToggle={() => toggleSection('adset')}
        >
          {state.adsetTypes.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-tertiary)' }}>Nenhum tipo de adset configurado.</p>
          ) : (
            <div className="space-y-3">
              {state.adsetTypes.map((t) => (
                <div key={t.id} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--neon-cyan)' }}>
                    {t.name || 'Sem nome'} — {t.adsetCount} adsets x {t.campaignsCount} campanhas
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <InfoRow label="Criativos" value={t.creativesInAdset.filter(Boolean).join(', ') || '-'} small />
                    <InfoRow label="Evento" value={EVENT_LABELS[t.conversionEvent] || t.conversionEvent} small />
                    <InfoRow label="Pixel" value={t.pixelId || '-'} small />
                    <InfoRow label="Data início" value={t.startDate} small />
                    <InfoRow label="Países" value={t.targetCountries.join(', ')} small />
                    <InfoRow label="Status" value={t.adsetStatus === 'ACTIVE' ? 'Ativo' : 'Pausado'} small />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>

        {/* Ad Level */}
        <AccordionSection
          id="ad"
          title="Configurações - Anúncios"
          open={openSections.has('ad')}
          onToggle={() => toggleSection('ad')}
        >
          {!ad ? (
            <p className="text-sm" style={{ color: 'var(--color-tertiary)' }}>Anúncio não configurado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <InfoRow label="URL" value={ad.destinationUrl || '-'} />
              <InfoRow label="Formato" value={ad.creativeFormat} />
              <InfoRow label="Criativos" value={`${ad.creativeFiles.length} arquivo(s)`} />
              <InfoRow label="Título" value={ad.headline || '-'} />
              <InfoRow label="Texto" value={ad.primaryText ? (ad.primaryText.length > 60 ? ad.primaryText.slice(0, 60) + '...' : ad.primaryText) : '-'} />
              <InfoRow label="Descrição" value={ad.description || '-'} />
              {ad.utmParams.utm_source && <InfoRow label="UTM Source" value={ad.utmParams.utm_source} />}
              {ad.utmParams.utm_medium && <InfoRow label="UTM Medium" value={ad.utmParams.utm_medium} />}
              {ad.utmParams.utm_campaign && <InfoRow label="UTM Campaign" value={ad.utmParams.utm_campaign} />}
            </div>
          )}
        </AccordionSection>
      </div>

      {/* --- Publish Button --- */}
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

      {/* --- Publish Confirmation Modal --- */}
      {showPublishModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPublishModal(false)} />
          <div className="relative rounded-xl p-6 border shadow-xl max-w-md w-full" style={{ backgroundColor: '#1a1a2e', borderColor: 'var(--border-light)' }}>
            {!published ? (
              <>
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-primary)', ...headingFont }}>
                  Confirmar Publicação
                </p>
                <p className="text-sm mb-4" style={{ color: 'var(--color-secondary)' }}>
                  Você está prestes a publicar{' '}
                  <strong style={{ color: 'var(--neon-green)' }}>{state.totalCampaigns}</strong> campanha{state.totalCampaigns > 1 ? 's' : ''} com{' '}
                  <strong style={{ color: 'var(--neon-cyan)' }}>{totalAdsets}</strong> adsets em{' '}
                  <strong>{state.selectedAccountIds.length}</strong> conta{state.selectedAccountIds.length > 1 ? 's' : ''}.
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--color-secondary)' }}>
                  Orçamento total: <strong style={{ color: 'var(--neon-green)' }}>{formatCurrency(totalBudget)}</strong>
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 rounded-lg border text-sm"
                    style={{ borderColor: 'var(--border-light)', color: 'var(--color-secondary)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handlePublish}
                    className="px-5 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: 'var(--neon-green)', color: 'var(--bg-deepest)' }}
                  >
                    Confirmar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-3xl mb-3">&#128679;</p>
                <p className="text-base font-medium mb-2" style={{ color: 'var(--color-primary)', ...headingFont }}>
                  Publicação será implementada no próximo bloco
                </p>
                <p className="text-sm mb-4" style={{ color: 'var(--color-tertiary)' }}>
                  A etapa foi marcada como concluída.
                </p>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-5 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'rgba(57, 255, 20, 0.15)', color: 'var(--neon-green)', border: '1px solid rgba(57, 255, 20, 0.3)' }}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function SummaryCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="p-3 rounded-lg border text-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: highlight ? 'rgba(57, 255, 20, 0.3)' : 'var(--border-light)',
      }}
    >
      <div className="mb-1.5" style={{ color: highlight ? 'var(--neon-green)' : 'var(--color-secondary)' }}>{icon}</div>
      <p
        className="text-lg font-bold"
        style={{
          color: highlight ? 'var(--neon-green)' : 'var(--color-primary)',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          textShadow: highlight ? '0 0 8px rgba(57, 255, 20, 0.3)' : 'none',
        }}
      >
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-tertiary)' }}>{label}</p>
    </div>
  );
}

function AccordionSection({ id, title, open, onToggle, children }: { id: string; title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: open ? 'rgba(57, 255, 20, 0.2)' : 'var(--border-light)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <svg
          className="w-4 h-4 transition-transform flex-shrink-0"
          style={{ color: 'var(--color-secondary)', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-bold" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          {title}
        </span>
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
      <span className={small ? 'text-xs' : 'text-xs'} style={{ color: 'var(--color-tertiary)' }}>{label}: </span>
      <span className={small ? 'text-xs' : 'text-sm'} style={{ color: 'var(--color-primary)' }}>{value}</span>
    </div>
  );
}

// --- Icons (inline SVG) ---

function MoneyIcon() {
  return (
    <svg className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zm16.5-13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="w-5 h-5 mx-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}
