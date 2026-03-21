import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWizard, AdsetTypeConfig } from '@/contexts/WizardContext';

const CONVERSION_LOCATIONS = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'APP', label: 'App' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'CALLS', label: 'Chamadas' },
  { value: 'INSTAGRAM', label: 'Instagram' },
];

const CONVERSION_EVENTS = [
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'VIEW_CONTENT', label: 'Visita ao Perfil' },
  { value: 'ADD_TO_CART', label: 'Adicionar ao Carrinho' },
  { value: 'INITIATE_CHECKOUT', label: 'Iniciar Checkout' },
  { value: 'COMPLETE_REGISTRATION', label: 'Registro' },
];

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'FR', name: 'França', flag: '🇫🇷' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵' },
  { code: 'AU', name: 'Austrália', flag: '🇦🇺' },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function Tab4Adsets() {
  const { state, dispatch } = useWizard();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const needsBidCap =
    state.campaignConfig.bidStrategy === 'LOWEST_COST_WITH_BID_CAP' ||
    state.campaignConfig.bidStrategy === 'COST_CAP';

  const totalProgrammed = state.adsetsPerCampaign * state.totalCampaigns;
  const totalConfigured = state.adsetTypes.reduce((sum, t) => sum + t.adsetCount * t.campaignsCount, 0);
  const mismatch = state.adsetTypes.length > 0 && totalConfigured !== totalProgrammed;

  // Fetch pixels for all selected accounts
  const { data: allPixels } = useQuery({
    queryKey: ['wizard-pixels', state.selectedAccountIds],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];

      const pixels: Array<{ id: string; name: string }> = [];
      for (const accountId of state.selectedAccountIds) {
        try {
          const res = await fetch(`/api/meta/accounts/pixels?accountId=${accountId}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (!res.ok) continue;
          const data = await res.json();
          for (const p of data.pixels || []) {
            if (!pixels.some((x) => x.id === p.id)) pixels.push(p);
          }
        } catch { /* skip */ }
      }
      return pixels;
    },
    enabled: state.selectedAccountIds.length > 0,
    staleTime: 0,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addType = () => {
    const newType: AdsetTypeConfig = {
      id: generateId(),
      name: '',
      adsetCount: 1,
      campaignsCount: state.totalCampaigns,
      creativesInAdset: [''],
      conversionLocation: 'WEBSITE',
      pixelId: '',
      conversionEvent: 'PURCHASE',
      startDate: new Date().toISOString().split('T')[0],
      targetCountries: ['BR'],
      adsetStatus: 'PAUSED',
    };
    dispatch({ type: 'ADD_ADSET_TYPE', payload: newType });
    setExpandedIds((prev) => new Set(prev).add(newType.id));
  };

  const updateType = (id: string, updates: Partial<AdsetTypeConfig>) => {
    dispatch({ type: 'UPDATE_ADSET_TYPE', payload: { id, updates } });
  };

  const removeType = (id: string) => {
    dispatch({ type: 'REMOVE_ADSET_TYPE', payload: id });
    setRemoveConfirm(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={addType}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: 'var(--neon-green)',
            color: 'var(--bg-deepest)',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            boxShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
          }}
        >
          + Adicionar Tipo de Adset
        </button>
        <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>
          {state.adsetTypes.length} tipo{state.adsetTypes.length !== 1 && 's'} configurado{state.adsetTypes.length !== 1 && 's'}
          {' | '}
          <strong style={{ color: totalConfigured === totalProgrammed ? 'var(--neon-green)' : 'var(--color-warning)' }}>
            {totalConfigured}
          </strong>{' '}
          adsets de {totalProgrammed} programados
        </span>
      </div>

      {/* Mismatch Alert */}
      {mismatch && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)' }}>
          <p className="text-sm" style={{ color: 'var(--color-warning)' }}>
            Os adsets configurados ({totalConfigured}) não batem com o total programado ({totalProgrammed}). Ajuste os volumes.
          </p>
        </div>
      )}

      {/* Empty State */}
      {state.adsetTypes.length === 0 && (
        <div className="p-8 rounded-lg text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-light)' }}>
          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
            Nenhum tipo de adset configurado. Clique em &ldquo;+ Adicionar Tipo de Adset&rdquo; para começar.
          </p>
        </div>
      )}

      {/* Adset Type Cards */}
      {state.adsetTypes.map((adsetType) => (
        <AdsetTypeCard
          key={adsetType.id}
          adsetType={adsetType}
          expanded={expandedIds.has(adsetType.id)}
          onToggle={() => toggleExpand(adsetType.id)}
          onUpdate={(updates) => updateType(adsetType.id, updates)}
          onRemove={() => setRemoveConfirm(adsetType.id)}
          needsBidCap={needsBidCap}
          pixels={allPixels || []}
          totalCampaigns={state.totalCampaigns}
        />
      ))}

      {/* Remove Confirmation */}
      {removeConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setRemoveConfirm(null)} />
          <div className="relative rounded-xl p-6 border shadow-xl max-w-sm" style={{ backgroundColor: '#1a1a2e', borderColor: 'var(--border-light)' }}>
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-primary)' }}>Remover este tipo de adset?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRemoveConfirm(null)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-light)', color: 'var(--color-secondary)' }}>Cancelar</button>
              <button onClick={() => removeType(removeConfirm)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Subcomponent: Single Adset Type Card ---

interface AdsetTypeCardProps {
  adsetType: AdsetTypeConfig;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<AdsetTypeConfig>) => void;
  onRemove: () => void;
  needsBidCap: boolean;
  pixels: Array<{ id: string; name: string }>;
  totalCampaigns: number;
}

function AdsetTypeCard({ adsetType, expanded, onToggle, onUpdate, onRemove, needsBidCap, pixels, totalCampaigns }: AdsetTypeCardProps) {
  const [newCreative, setNewCreative] = useState('');

  const addCreative = () => {
    const name = newCreative.trim();
    if (!name) return;
    onUpdate({ creativesInAdset: [...adsetType.creativesInAdset, name] });
    setNewCreative('');
  };

  const removeCreative = (index: number) => {
    if (adsetType.creativesInAdset.length <= 1) return;
    onUpdate({ creativesInAdset: adsetType.creativesInAdset.filter((_, i) => i !== index) });
  };

  const updateCreative = (index: number, value: string) => {
    const updated = [...adsetType.creativesInAdset];
    updated[index] = value;
    onUpdate({ creativesInAdset: updated });
  };

  const toggleCountry = (code: string) => {
    const has = adsetType.targetCountries.includes(code);
    onUpdate({
      targetCountries: has
        ? adsetType.targetCountries.filter((c) => c !== code)
        : [...adsetType.targetCountries, code],
    });
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border-light)',
    color: 'var(--color-primary)',
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: expanded ? 'rgba(57, 255, 20, 0.3)' : 'var(--border-light)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
    >
      {/* Header — always visible */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <svg
          className="w-4 h-4 transition-transform flex-shrink-0"
          style={{ color: 'var(--color-secondary)', transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--color-primary)' }}>
          {adsetType.name || 'Tipo sem nome'}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0, 240, 255, 0.3)' }}
        >
          {adsetType.adsetCount * adsetType.campaignsCount} adsets
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--color-danger)' }}
          aria-label="Remover tipo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderTopColor: 'var(--border-light)' }}>
          {/* a) Nome */}
          <Field label="Nome do Adset">
            <input
              type="text"
              value={adsetType.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Cr1_leva10_Angulo2"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </Field>

          {/* b) Volume */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Adsets deste tipo">
              <input
                type="number" min={1}
                value={adsetType.adsetCount}
                onChange={(e) => onUpdate({ adsetCount: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="Em quantas campanhas">
              <input
                type="number" min={1} max={totalCampaigns}
                value={adsetType.campaignsCount}
                onChange={(e) => onUpdate({ campaignsCount: Math.min(parseInt(e.target.value) || 1, totalCampaigns) })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
            </Field>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
            Distribuição: {adsetType.adsetCount} adsets × {adsetType.campaignsCount} campanha{adsetType.campaignsCount > 1 && 's'} = {adsetType.adsetCount * adsetType.campaignsCount} adsets totais
          </p>

          {/* c) Criativos */}
          <Field label="Criativos dentro de cada adset (cada criativo = 1 anúncio)">
            <div className="space-y-2">
              {adsetType.creativesInAdset.map((cr, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cr}
                    onChange={(e) => updateCreative(i, e.target.value)}
                    placeholder={`Criativo ${i + 1}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={inputStyle}
                  />
                  {adsetType.creativesInAdset.length > 1 && (
                    <button onClick={() => removeCreative(i)} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--color-danger)' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCreative}
                  onChange={(e) => setNewCreative(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCreative()}
                  placeholder="Novo criativo..."
                  className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
                <button
                  onClick={addCreative}
                  disabled={!newCreative.trim()}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                  style={{ backgroundColor: 'rgba(57, 255, 20, 0.15)', color: 'var(--neon-green)', border: '1px solid rgba(57, 255, 20, 0.3)' }}
                >
                  +
                </button>
              </div>
            </div>
          </Field>

          {/* d) Local de Conversão */}
          <Field label="Local de Conversão">
            <select
              value={adsetType.conversionLocation}
              onChange={(e) => onUpdate({ conversionLocation: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            >
              {CONVERSION_LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Field>

          {/* e) Bid Cap — conditional */}
          {needsBidCap && (
            <Field label="Meta de Desempenho (Bid Cap)">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>R$</span>
                <input
                  type="number" min={0} step={0.01}
                  value={(adsetType.bidCapValue || 0) / 100 || ''}
                  onChange={(e) => onUpdate({ bidCapValue: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </Field>
          )}

          {/* f) Pixel */}
          <Field label="Pixel">
            <select
              value={adsetType.pixelId}
              onChange={(e) => onUpdate({ pixelId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            >
              <option value="">Selecione um pixel</option>
              {(pixels || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          {/* g) Evento de Conversão */}
          <Field label="Evento de Conversão">
            <select
              value={adsetType.conversionEvent}
              onChange={(e) => onUpdate({ conversionEvent: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            >
              {CONVERSION_EVENTS.map((ev) => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
            </select>
          </Field>

          {/* h) Data de Início */}
          <Field label="Data de Início">
            <input
              type="date"
              value={adsetType.startDate}
              onChange={(e) => onUpdate({ startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </Field>

          {/* i) Localização */}
          <Field label="Localização (Países)">
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => {
                const isSelected = adsetType.targetCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    onClick={() => toggleCountry(c.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all"
                    style={{
                      backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.08)' : 'transparent',
                      borderColor: isSelected ? 'rgba(57, 255, 20, 0.4)' : 'var(--border-light)',
                      color: isSelected ? 'var(--neon-green)' : 'var(--color-secondary)',
                    }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* j) Status */}
          <Field label="Status do Adset">
            <div className="flex gap-2">
              {(['ACTIVE', 'PAUSED'] as const).map((status) => {
                const isActive = adsetType.adsetStatus === status;
                const label = status === 'ACTIVE' ? 'Ativo' : 'Pausado';
                const color = status === 'ACTIVE' ? 'var(--neon-green)' : 'var(--color-warning)';
                return (
                  <button
                    key={status}
                    onClick={() => onUpdate({ adsetStatus: status })}
                    className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? (status === 'ACTIVE' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 183, 3, 0.1)') : 'transparent',
                      borderColor: isActive ? color : 'var(--border-light)',
                      color: isActive ? color : 'var(--color-secondary)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

// --- Helper ---
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pt-3">
      <label className="block text-xs mb-1.5" style={{ color: 'var(--color-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}
