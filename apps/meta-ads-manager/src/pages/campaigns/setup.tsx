import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import ConfigPopupV2 from '@/components/campaign-wizard/ConfigPopupV2';
import { authenticatedFetch } from '@/lib/api-client';
import { Plus, FileText, Trash2, LayoutTemplate, Zap } from 'lucide-react';

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateToLoad, setTemplateToLoad] = useState<any>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNewWizard = () => {
    queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
    setDraftState(null);
    setTemplateToLoad(null);
    setShowPopup(true);
  };

  const openDraft = () => {
    queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['wizard-pages'] });
    setTemplateToLoad(null);
    setShowPopup(true);
  };

  const openFromTemplate = (template: Template) => {
    queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
    setDraftState(null);
    setTemplateToLoad(template.config_json);
    setShowPopup(true);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTemplateId(id);
    try {
      const res = await authenticatedFetch('/api/templates/save', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      if (res.ok) setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handlePopupClose = async () => {
    setShowPopup(false);
    setTemplateToLoad(null);
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
    }
  };

  return (
    <DashboardLayout title="Subir Campanhas">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Campanhas', href: '/campaigns' }, { label: 'Subir Campanhas', href: '/campaigns/setup' }]} />

      <div style={{ padding: '16px 24px 24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
              Subir Campanhas
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
              Configure e publique em múltiplas contas de uma vez
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!loadingDraft && hasDraft && (
              <button
                onClick={openDraft}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={13} aria-hidden="true" />
                Editar Rascunho
              </button>
            )}
            <button
              onClick={openNewWizard}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={13} aria-hidden="true" />
              Iniciar Configuração
            </button>
          </div>
        </div>

        {/* Main layout: info cards (35%) + templates (65%) */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* Left — info cards (35%) */}
          <div style={{ width: '35%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Card 1 — Como funciona */}
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(22,163,74,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-accent-bright)',
                  flexShrink: 0,
                }}>
                  <Zap size={15} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                  Como funciona
                </span>
              </div>
              <ol style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Escolha as contas e páginas',
                  'Configure lotes e criativos',
                  'Defina orçamento e segmentação',
                  'Revise e publique em massa',
                ].map((step, i) => (
                  <li key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Card 2 — Rascunho ativo */}
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--color-bg-surface)',
              border: hasDraft ? '1px solid rgba(22,163,74,0.3)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: hasDraft ? 'rgba(22,163,74,0.1)' : 'var(--color-bg-input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: hasDraft ? 'var(--color-accent-bright)' : 'var(--color-text-tertiary)',
                  flexShrink: 0,
                }}>
                  <FileText size={15} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                  Rascunho
                </span>
              </div>
              {loadingDraft ? (
                <div className="animate-pulse" style={{ height: '16px', width: '80%', borderRadius: '4px', backgroundColor: 'var(--color-bg-input)' }} />
              ) : hasDraft ? (
                <>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-success)', marginBottom: '12px' }}>
                    Você tem um rascunho salvo
                  </p>
                  <button
                    onClick={openDraft}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '6px 12px' }}
                  >
                    Continuar de onde parou
                  </button>
                </>
              ) : (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  Nenhum rascunho salvo. Inicie uma configuração para começar.
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', backgroundColor: 'var(--color-border)', alignSelf: 'stretch', flexShrink: 0 }} />

          {/* Right — templates (65%) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <LayoutTemplate size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
              <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: 0 }}>
                Templates salvos
              </h2>
              {templates.length > 0 && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
                  {templates.length} template{templates.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loadingTemplates ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse" style={{ height: '120px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)' }} />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div style={{
                padding: '40px 24px',
                textAlign: 'center',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
              }}>
                <LayoutTemplate size={24} strokeWidth={1} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 10px' }} aria-hidden="true" />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                  Nenhum template salvo ainda
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                  Salve configurações durante o wizard para reutilizá-las aqui
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {templates.map(tpl => {
                  const cfg = tpl.config_json;
                  const accounts = cfg?.selectedAccountIds?.length ?? 0;
                  const pages = cfg?.selectedPageIds?.length ?? 0;
                  const campaigns = cfg?.totalCampaigns ?? 0;
                  const dateStr = new Date(tpl.created_at).toLocaleDateString('pt-BR');

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => openFromTemplate(tpl)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && openFromTemplate(tpl)}
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'border-color 120ms ease, box-shadow 120ms ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-accent)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
                        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {tpl.name}
                        </h3>
                        <button
                          onClick={e => handleDeleteTemplate(tpl.id, e)}
                          disabled={deletingTemplateId === tpl.id}
                          aria-label={`Excluir template ${tpl.name}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: 'var(--color-text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            transition: 'color 120ms ease',
                            opacity: deletingTemplateId === tpl.id ? 0.4 : 1,
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'; }}
                        >
                          <Trash2 size={13} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {[`${accounts} conta${accounts !== 1 ? 's' : ''}`, `${pages} página${pages !== 1 ? 's' : ''}`, `${campaigns} camp.`].map(tag => (
                          <span key={tag} style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '11px',
                            color: 'var(--color-text-tertiary)',
                            backgroundColor: 'var(--color-bg-input)',
                            padding: '2px 7px',
                            borderRadius: '20px',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          {dateStr}
                        </span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-accent-bright)', fontWeight: 500 }}>
                          Usar →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <ConfigPopupV2
          draftState={hasDraft && !templateToLoad ? draftState : null}
          draftId={!templateToLoad ? draftId : null}
          templateState={templateToLoad}
          onClose={handlePopupClose}
          onSaved={fetchTemplates}
        />
      )}
    </DashboardLayout>
  );
}
