import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
// ROLLBACK: descomentar as 2 linhas abaixo e comentar ConfigPopupV2 para voltar ao wizard antigo
// import { WizardProvider, useWizard } from '@/contexts/WizardContext';
// import ConfigPopup from '@/components/campaign-wizard/ConfigPopup';
import ConfigPopupV2 from '@/components/campaign-wizard/ConfigPopupV2';
import { authenticatedFetch } from '@/lib/api-client';

interface Template {
  id: string;
  name: string;
  config_json: any;
  created_at: string;
}

export default function CampaignSetupPage() {
  const queryClient = useQueryClient();
  const [showPopup, setShowPopup] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftState, setDraftState] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateToLoad, setTemplateToLoad] = useState<any>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const headingFont = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };

  const fetchTemplates = async () => {
    try {
      const res = await authenticatedFetch('/api/templates/save');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    const checkDraft = async () => {
      try {
        const res = await authenticatedFetch('/api/drafts/current');

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
    fetchTemplates();
  }, [showPopup]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const callStep = async (step: string, extra?: Record<string, any>) => {
        const res = await authenticatedFetch('/api/meta/sync-all', {
          method: 'POST',
          body: JSON.stringify({ step, ...extra }),
        });
        if (!res.ok) throw new Error(`Step ${step} failed`);
        return res.json();
      };

      setSyncResult('Sincronizando contas...');
      const accountsData = await callStep('accounts');

      setSyncResult('Sincronizando páginas...');
      const pagesData = await callStep('pages');

      setSyncResult('Sincronizando pixels...');
      const pixelsRes = await authenticatedFetch('/api/meta/sync-all', {
        method: 'POST',
        body: JSON.stringify({
          step: 'pixels',
          logSync: true,
          synced_accounts: accountsData.synced_accounts,
          synced_pages: pagesData.synced_pages,
        }),
      });
      if (!pixelsRes.ok) throw new Error('Step pixels failed');
      const pixelsData = await pixelsRes.json();

      setSyncResult(
        `${accountsData.synced_accounts} contas, ${pagesData.synced_pages} páginas, ${pixelsData.synced_pixels} pixels sincronizados`
      );
      queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
    } catch (e) {
      setSyncResult('Erro de conexão');
    } finally {
      setSyncing(false);
    }
  };

  const openNewWizard = () => {
    queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
    setDraftState(null);
    setTemplateToLoad(null);
    setShowPopup(true);
  };

  const openFromTemplate = (template: Template) => {
    queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
    setDraftState(null);
    setTemplateToLoad(template.config_json);
    setShowPopup(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
    try {
      const res = await authenticatedFetch('/api/templates/save', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setTemplateToLoad(null);
  };

  const handleSaved = () => {
    fetchTemplates();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center h-full p-6 overflow-y-auto">
        <div className="text-center max-w-lg mb-10">
          <h1
            className="text-3xl font-bold mb-3"
            style={{
              color: 'var(--neon-green)',
              ...headingFont,
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
                ...headingFont,
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
                ...headingFont,
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
                  queryClient.invalidateQueries({ queryKey: ['wizard-pages'] });
                  setTemplateToLoad(null);
                  setShowPopup(true);
                }}
                className="px-6 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{
                  borderColor: 'rgba(0, 240, 255, 0.3)',
                  color: 'var(--neon-cyan)',
                  ...headingFont,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Editar Rascunho
              </button>
            )}
          </div>
        </div>

        {/* Templates Section */}
        {!loadingTemplates && templates.length > 0 && (
          <div className="w-full max-w-3xl">
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--neon-green)', ...headingFont }}
            >
              Seus Templates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((tpl) => {
                const cfg = tpl.config_json;
                const accounts = cfg?.selectedAccountIds?.length ?? 0;
                const pages = cfg?.selectedPageIds?.length ?? 0;
                const campaigns = cfg?.totalCampaigns ?? 0;
                const dateStr = new Date(tpl.created_at).toLocaleDateString('pt-BR');

                return (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'var(--border-light)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className="text-sm font-semibold truncate flex-1 mr-2"
                        style={{ color: 'var(--color-primary)', ...headingFont }}
                      >
                        {tpl.name}
                      </h3>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        disabled={deletingTemplateId === tpl.id}
                        className="text-xs px-2 py-1 rounded transition-colors hover:bg-white/10 flex-shrink-0"
                        style={{ color: 'var(--color-danger)' }}
                        title="Excluir template"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--color-tertiary)' }}>
                      <span>{accounts} contas</span>
                      <span>{pages} páginas</span>
                      <span>{campaigns} campanhas</span>
                      <span>{dateStr}</span>
                    </div>
                    <button
                      onClick={() => openFromTemplate(tpl)}
                      className="w-full py-2 rounded-lg border text-xs font-medium transition-all"
                      style={{
                        borderColor: 'rgba(57, 255, 20, 0.3)',
                        color: 'var(--neon-green)',
                        ...headingFont,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--neon-green)'; e.currentTarget.style.boxShadow = '0 0 8px rgba(57, 255, 20, 0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      Usar Template
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ROLLBACK: descomentar WizardProvider + PopupWithDraft para voltar ao wizard antigo */}
      {/* {showPopup && (
        <WizardProvider>
          <PopupWithDraft
            draftState={hasDraft && !templateToLoad ? draftState : null}
            draftId={!templateToLoad ? draftId : null}
            templateState={templateToLoad}
            onClose={handlePopupClose}
            onSaved={handleSaved}
          />
        </WizardProvider>
      )} */}
      {showPopup && (
        <ConfigPopupV2
          onClose={handlePopupClose}
          onSaved={handleSaved}
        />
      )}
    </DashboardLayout>
  );
}

// ROLLBACK: descomentar PopupWithDraft + import ConfigPopup para voltar ao wizard antigo
// function PopupWithDraft({ draftState, draftId, templateState, onClose, onSaved }: {
//   draftState: any;
//   draftId: string | null;
//   templateState: any;
//   onClose: () => void;
//   onSaved: () => void;
// }) {
//   const { dispatch } = useWizard();
//   useEffect(() => {
//     if (templateState) {
//       dispatch({ type: 'LOAD_DRAFT', payload: { state: templateState, draftId: '' } });
//     } else if (draftState && draftId) {
//       dispatch({ type: 'LOAD_DRAFT', payload: { state: draftState, draftId } });
//     }
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps
//   return <ConfigPopup onClose={onClose} onSaved={onSaved} />;
// }
