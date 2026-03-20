import React, { useState, useEffect, Component, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { WizardProvider, useWizard } from '@/contexts/WizardContext';
import ConfigPopup from '@/components/campaign-wizard/ConfigPopup';
import { supabase } from '@/lib/supabase';

// Error boundary to catch popup render crashes
class PopupErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error) {
    console.error('[Wizard] Popup crashed:', error);
  }
  render() {
    if (this.state.hasError) {
      return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-xl p-8 max-w-md" style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,51,51,0.5)' }}>
            <p className="text-lg font-bold mb-2" style={{ color: '#ff3333' }}>Erro ao abrir wizard</p>
            <p className="text-sm mb-4" style={{ color: '#aaa' }}>{this.state.error}</p>
            <button
              onClick={this.props.onError}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#39ff14', color: '#0a0a0f' }}
            >
              Fechar
            </button>
          </div>
        </div>,
        document.body
      );
    }
    return this.props.children;
  }
}

export default function CampaignSetupPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftState, setDraftState] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure portal target exists (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for existing draft
  useEffect(() => {
    const checkDraft = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setLoadingDraft(false); return; }

        const res = await fetch('/api/drafts/current', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setHasDraft(true);
          setDraftState(data.state);
          setDraftId(data.id);
        } else {
          setHasDraft(false);
        }
      } catch {
        setHasDraft(false);
      } finally {
        setLoadingDraft(false);
      }
    };
    checkDraft();
  }, [showPopup]);

  const openNewWizard = () => {
    console.log('[Wizard] Opening new wizard');
    setDraftState(null);
    setShowPopup(true);
  };

  const openDraftWizard = () => {
    console.log('[Wizard] Opening draft wizard');
    setShowPopup(true);
  };

  const closePopup = () => {
    console.log('[Wizard] Closing popup');
    setShowPopup(false);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-lg">
          <h1
            className="text-3xl font-bold mb-3"
            style={{
              color: 'var(--neon-green)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              textShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
            }}
          >
            Subir Campanhas
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-secondary)' }}>
            Configure e publique campanhas em múltiplas contas e páginas de uma vez.
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={openNewWizard}
              className="px-8 py-3 rounded-lg font-semibold text-sm transition-all"
              style={{
                backgroundColor: 'var(--neon-green)',
                color: 'var(--bg-deepest)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                letterSpacing: '0.05em',
                boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(57, 255, 20, 0.6)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Iniciar Configuração
            </button>

            {!loadingDraft && hasDraft && (
              <button
                onClick={openDraftWizard}
                className="px-6 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{
                  borderColor: 'rgba(0, 240, 255, 0.3)',
                  color: 'var(--neon-cyan)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Editar Rascunho
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Portal: render popup directly on document.body to avoid z-index/overflow issues */}
      {showPopup && mounted && createPortal(
        <PopupErrorBoundary onError={closePopup}>
          <WizardProvider>
            <PopupWithDraft
              draftState={hasDraft ? draftState : null}
              draftId={draftId}
              onClose={closePopup}
            />
          </WizardProvider>
        </PopupErrorBoundary>,
        document.body
      )}
    </DashboardLayout>
  );
}

function PopupWithDraft({ draftState, draftId, onClose }: { draftState: any; draftId: string | null; onClose: () => void }) {
  const { dispatch } = useWizard();

  useEffect(() => {
    console.log('[Wizard] PopupWithDraft mounted, draftState:', !!draftState);
    if (draftState && draftId) {
      dispatch({ type: 'LOAD_DRAFT', payload: { state: draftState, draftId } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <ConfigPopup onClose={onClose} />;
}
