import React, { useState } from 'react';
import { useWizardStore, selectCurrentStep, selectCompletedSteps, selectMode, selectBatches } from '@/stores/wizard-store';
import ModeSelector from './ModeSelector';
import BatchCard from './BatchCard';
import ChecklistSidebar from './ChecklistSidebar';
import CreativePoolStep from './CreativePoolStep';
import CampaignConfigStep from './CampaignConfigStep';
import AdCopyStep from './AdCopyStep';
import PreviewPublishStep from './PreviewPublishStep';

/**
 * ConfigPopupV2 — Novo wizard com sistema de lotes (batches)
 *
 * Etapas:
 * 0. Selecao de modo (quick / advanced / add_adsets)
 * 1. Engenharia de lotes (batch cards com contas, paginas, volume, config, adsets)
 * 2. Pool de criativos (compartilhado entre lotes) — [PROMPT 2/3]
 * 3. Configuracao de anuncio (copy, UTM, URL destino) — [PROMPT 2/3]
 * 4. Preview e publicacao
 * 5. Salvar template
 */

const STEPS = [
  { label: 'Modo', index: 0 },
  { label: 'Lotes', index: 1 },
  { label: 'Criativos', index: 2 },
  { label: 'Campanha', index: 3 },
  { label: 'Copy', index: 4 },
  { label: 'Publicar', index: 5 },
];

interface ConfigPopupV2Props {
  onClose: () => void;
  onSaved?: () => void;
  draftState?: any;
  draftId?: string | null;
  templateState?: any;
}

export default function ConfigPopupV2({ onClose, onSaved, draftState, draftId, templateState }: ConfigPopupV2Props) {
  const currentStep = useWizardStore(selectCurrentStep);
  const completedSteps = useWizardStore(selectCompletedSteps);
  const mode = useWizardStore(selectMode);
  const batches = useWizardStore(selectBatches);
  const setStep = useWizardStore((s) => s.setStep);
  const markStepComplete = useWizardStore((s) => s.markStepComplete);
  const addBatch = useWizardStore((s) => s.addBatch);
  const loadDraft = useWizardStore((s) => s.loadDraft);
  const reset = useWizardStore((s) => s.reset);

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Load draft or template into Zustand store on mount
  React.useEffect(() => {
    if (templateState) {
      reset();
      loadDraft(templateState, '');
    } else if (draftState && draftId) {
      loadDraft(draftState, draftId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => setShowConfirmClose(true);
  const confirmClose = () => { setShowConfirmClose(false); onClose(); };

  const handleTabClick = (index: number) => {
    // Step 0 (mode) must be completed before accessing other steps
    if (index > 0 && !mode) return;
    setStep(index);
  };

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!mode;
      case 1:
        return batches.length > 0 && batches.every(b =>
          b.accounts.length > 0 && b.pages.length > 0
        );
      case 2:
        // Criativos — placeholder, sera implementado no PROMPT 2/3
        return true;
      case 3:
        // Anuncio — placeholder, sera implementado no PROMPT 2/3
        return true;
      default:
        return true;
    }
  };

  const handleAdvance = () => {
    markStepComplete(currentStep);
    if (currentStep < 5) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const getAdvanceLabel = () => {
    if (currentStep === 5) return 'Revisar e Publicar';
    return 'Confirmar e Avancar';
  };

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return <ModeSelector />;
      case 1:
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{
                    color: 'var(--color-primary)',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  }}
                >
                  Engenharia de Lotes
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                  Cada lote gera uma chamada independente ao bulk-publish
                </p>
              </div>
              {mode === 'advanced' && (
                <button
                  onClick={() => addBatch()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(57, 255, 20, 0.08)',
                    border: '1px solid rgba(57, 255, 20, 0.25)',
                    color: 'var(--neon-green)',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Novo Lote
                </button>
              )}
            </div>

            <div className="space-y-3">
              {batches.map((batch, i) => (
                <BatchCard key={batch.id} batch={batch} index={i} />
              ))}
            </div>

            {batches.length === 0 && (
              <div
                className="p-6 rounded-lg text-center"
                style={{
                  backgroundColor: 'rgba(255, 183, 3, 0.1)',
                  border: '1px solid rgba(255, 183, 3, 0.3)',
                }}
              >
                <p style={{ color: 'var(--color-warning)' }}>
                  Nenhum lote criado. Volte e selecione um modo.
                </p>
              </div>
            )}
          </div>
        );
      case 2:
        return <CreativePoolStep />;
      case 3:
        return <CampaignConfigStep />;
      case 4:
        return <AdCopyStep />;
      case 5:
        return <PreviewPublishStep onSaved={onSaved} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '95vw',
          height: '95vh',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}
        >
          <h2
            className="text-xl font-bold"
            style={{
              color: 'var(--color-primary)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            Configuracao de Campanha
            {mode && (
              <span
                className="ml-3 text-xs font-normal px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(57, 255, 20, 0.1)',
                  color: 'var(--neon-green)',
                  border: '1px solid rgba(57, 255, 20, 0.2)',
                }}
              >
                {mode === 'quick' ? 'Rapido' : mode === 'advanced' ? 'Avancado' : 'Adicionar Adsets'}
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-all hover:bg-white/5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-green/20"
            style={{ color: 'var(--color-secondary)', transitionDuration: '150ms' }}
            aria-label="Fechar"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 px-6 overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(57, 255, 20, 0.1)' }}
        >
          {STEPS.map((step) => {
            const isActive = currentStep === step.index;
            const isCompleted = completedSteps.includes(step.index);
            const isDisabled = step.index > 0 && !mode;
            return (
              <button
                key={step.index}
                onClick={() => handleTabClick(step.index)}
                disabled={isDisabled}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative disabled:cursor-not-allowed cursor-pointer focus:outline-none"
                style={{
                  color: isActive
                    ? 'var(--neon-green)'
                    : isCompleted
                    ? 'var(--color-success)'
                    : 'var(--color-secondary)',
                  opacity: isDisabled ? 0.3 : isActive || isCompleted ? 1 : 0.7,
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  letterSpacing: '0.01em',
                  transitionDuration: '150ms',
                }}
              >
                {isCompleted && !isActive && (
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {step.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      backgroundColor: 'var(--neon-green)',
                      boxShadow: '0 0 8px rgba(57, 255, 20, 0.5)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content + Checklist Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>

          {/* Checklist sidebar — visible on steps 1+ */}
          {currentStep > 0 && <ChecklistSidebar />}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(57, 255, 20, 0.1)' }}
        >
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-5 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-green/20"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--color-secondary)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              transitionDuration: '150ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-row-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''; }}
          >
            Voltar
          </button>
          <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
            Etapa {currentStep + 1} de 6
            {batches.length > 0 && ` · ${batches.length} lote${batches.length !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={handleAdvance}
            disabled={!canAdvance()}
            className="btn-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:filter-none"
          >
            {getAdvanceLabel()}
          </button>
        </div>
      </div>

      {/* Confirm Close Modal */}
      {showConfirmClose && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowConfirmClose(false)} />
          <div
            className="relative p-6 shadow-xl max-w-md w-full mx-4"
            style={{
              backgroundColor: 'var(--bg-card-hover)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              Sair da configuracao?
            </p>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
              Seu progresso sera salvo automaticamente. Deseja sair?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="btn-ghost text-sm px-4 py-2 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClose}
                className="btn-danger text-sm px-4 py-2 cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
