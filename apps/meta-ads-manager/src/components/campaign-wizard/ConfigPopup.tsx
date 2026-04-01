import React, { useState } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import Tab1Accounts from './tabs/Tab1Accounts';
import Tab2PagesVolume from './tabs/Tab2PagesVolume';
import Tab3Campaign from './tabs/Tab3Campaign';
import Tab4Adsets from './tabs/Tab4Adsets';
import Tab5Ads from './tabs/Tab5Ads';
import Tab6Preview from './tabs/Tab6Preview';
import Tab7Template from './tabs/Tab7Template';

const TABS = [
  { label: 'Contas', index: 0 },
  { label: 'Páginas & Volume', index: 1 },
  { label: 'Campanha', index: 2 },
  { label: 'Conjuntos', index: 3 },
  { label: 'Anúncios', index: 4 },
  { label: 'Preview', index: 5 },
  { label: 'Template', index: 6 },
];

interface ConfigPopupProps {
  onClose: () => void;
  onSaved?: () => void;
}

export default function ConfigPopup({ onClose, onSaved }: ConfigPopupProps) {
  const { state, dispatch } = useWizard();
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleClose = () => {
    setShowConfirmClose(true);
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const handleTabClick = (index: number) => {
    dispatch({ type: 'SET_STEP', payload: index });
  };

  const canAdvance = (): boolean => {
    switch (state.currentStep) {
      case 0:
        return state.selectedAccountIds.length > 0;
      case 1:
        return state.selectedPageIds.length > 0 && state.distributionMap.length > 0;
      case 2: {
        const c = state.campaignConfig;
        return (
          !!c.objective &&
          !!c.namingPattern.levaNumber &&
          !!c.namingPattern.creativeLabel &&
          c.budgetValue > 0 &&
          !!c.bidStrategy
        );
      }
      case 3: {
        if (state.adsetTypes.length === 0) return false;
        const totalConfigured = state.adsetTypes.reduce((sum, t) => sum + t.adsetCount * t.campaignsCount, 0);
        const totalProgrammed = state.adsetsPerCampaign * state.totalCampaigns;
        if (totalConfigured !== totalProgrammed) return false;
        return state.adsetTypes.every(
          (t) =>
            !!t.name &&
            t.adsetCount > 0 &&
            t.campaignsCount > 0 &&
            !!t.pixelId &&
            !!t.conversionEvent &&
            !!t.startDate &&
            t.targetCountries.length > 0
        );
      }
      case 4: {
        const ad = state.adConfig;
        if (!ad) return false;
        const urlOk = ad.destinationUrl.startsWith('http://') || ad.destinationUrl.startsWith('https://');
        return urlOk && ad.creativeFiles.length > 0 && !!ad.primaryText && !!ad.headline;
      }
      default:
        return true;
    }
  };

  const handleAdvance = () => {
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: state.currentStep });
    if (state.currentStep < 6) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const getAdvanceLabel = () => {
    if (state.currentStep === 5) return 'Publicar';
    if (state.currentStep === 6) return 'Salvar Template';
    return 'Confirmar e Avançar';
  };

  const renderContent = () => {
    switch (state.currentStep) {
      case 0:
        return <Tab1Accounts />;
      case 1:
        return <Tab2PagesVolume />;
      case 2:
        return <Tab3Campaign />;
      case 3:
        return <Tab4Adsets />;
      case 4:
        return <Tab5Ads />;
      case 5:
        return <Tab6Preview onGoToTemplate={() => {
          dispatch({ type: 'MARK_STEP_COMPLETE', payload: 5 });
          dispatch({ type: 'SET_STEP', payload: 6 });
        }} />;
      case 6:
        return <Tab7Template onSaved={() => {
          if (onSaved) onSaved();
          onClose();
        }} />;
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
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          border: '1px solid rgba(57, 255, 20, 0.2)',
          boxShadow: '0 0 40px rgba(57, 255, 20, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderBottomColor: 'var(--color-border)' }}
        >
          <h2
            className="text-xl font-bold"
            style={{
              color: 'var(--color-accent)',
              fontFamily: "var(--font-sans)",
              letterSpacing: '0.03em',
              textShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
            }}
          >
            Configuração de Campanha
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Fechar"
          >
            <svg width="20" height="20" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 px-6 border-b overflow-x-auto"
          style={{ borderBottomColor: 'var(--color-border)' }}
        >
          {TABS.map((tab) => {
            const isActive = state.currentStep === tab.index;
            const isCompleted = state.completedSteps.includes(tab.index);
            return (
              <button
                key={tab.index}
                onClick={() => handleTabClick(tab.index)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative"
                style={{
                  color: isActive
                    ? 'var(--color-accent)'
                    : isCompleted
                    ? 'var(--color-success)'
                    : 'var(--color-text-secondary)',
                  opacity: isActive || isCompleted ? 1 : 0.6,
                  fontFamily: "var(--font-sans)",
                  letterSpacing: '0.03em',
                }}
              >
                {isCompleted && !isActive && (
                  <svg width="16" height="16" className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {tab.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      boxShadow: '0 0 8px rgba(57, 255, 20, 0.5)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderTopColor: 'var(--color-border)' }}
        >
          <button
            onClick={handleBack}
            disabled={state.currentStep === 0}
            className="px-5 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              borderColor: 'rgba(57, 255, 20, 0.3)',
              color: 'var(--color-accent)',
              fontFamily: "var(--font-sans)",
            }}
          >
            Voltar
          </button>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Etapa {state.currentStep + 1} de 7
          </span>
          <button
            onClick={handleAdvance}
            disabled={!canAdvance()}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canAdvance() ? 'var(--color-accent)' : 'rgba(57, 255, 20, 0.3)',
              color: 'var(--color-bg-base)',
              fontFamily: "var(--font-sans)",
              letterSpacing: '0.03em',
              boxShadow: canAdvance() ? '0 0 12px rgba(57, 255, 20, 0.3)' : 'none',
            }}
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
            className="relative rounded-xl p-6 border shadow-xl max-w-md"
            style={{ backgroundColor: '#1a1a2e', borderColor: 'var(--color-border)' }}
          >
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Sair da configuração?
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Seu progresso será salvo como rascunho. Deseja sair?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmClose}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}
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
