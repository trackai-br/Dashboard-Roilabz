import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { WizardProvider, useWizard } from '@/contexts/WizardContext';
import ConfigPopup from '@/components/campaign-wizard/ConfigPopup';
import { supabase } from '@/lib/supabase';

export default function CampaignSetupPage() {
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftState, setDraftState] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

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

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSyncResult('Erro: não autenticado');
        return;
      }

      const res = await fetch('/api/meta/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setSyncResult(`${data.synced_accounts} contas, ${data.synced_pages} páginas, ${data.synced_pixels} pixels sincronizados`);
        // Invalidate accounts cache so wizard gets fresh data
        queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
      } else {
        setSyncResult(`Erro: ${data.error || 'falha na sincronização'}`);
      }
    } catch (e) {
      setSyncResult('Erro de conexão');
    } finally {
      setSyncing(false);
    }
  };

  const openNewWizard = () => {
    // Invalidate stale cache before opening
    queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
    setDraftState(null);
    setShowPopup(true);
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
            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-50"
              style={{
                borderColor: 'rgba(0, 240, 255, 0.3)',
                color: 'var(--neon-cyan)',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
              }}
              onMouseEnter={(e) => { if (!syncing) { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.2)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Contas'}
            </button>

            {syncResult && (
              <p className="text-xs" style={{ color: syncResult.startsWith('Erro') ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {syncResult}
              </p>
            )}

            {/* Main CTA */}
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
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
                  setShowPopup(true);
                }}
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

      {showPopup && (
        <WizardProvider>
          <PopupWithDraft
            draftState={hasDraft ? draftState : null}
            draftId={draftId}
            onClose={() => setShowPopup(false)}
          />
        </WizardProvider>
      )}
    </DashboardLayout>
  );
}

function PopupWithDraft({ draftState, draftId, onClose }: { draftState: any; draftId: string | null; onClose: () => void }) {
  const { dispatch } = useWizard();

  useEffect(() => {
    if (draftState && draftId) {
      dispatch({ type: 'LOAD_DRAFT', payload: { state: draftState, draftId } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <ConfigPopup onClose={onClose} />;
}
