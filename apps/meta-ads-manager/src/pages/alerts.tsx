import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';
import { Plus, X, ChevronDown } from 'lucide-react';

interface AlertRule {
  id: string;
  account_id: string;
  name: string;
  condition_type: string;
  condition_value: Record<string, any>;
  enabled: boolean;
  telegram_enabled: boolean;
  created_at: string;
}

const CONDITION_LABELS: Record<string, string> = {
  roas_below: 'ROAS abaixo de',
  daily_spend_above: 'Gasto diário acima de',
  cpc_above: 'CPC acima de',
  ctr_below: 'CTR abaixo de',
  conversion_rate_below: 'Taxa de conversão abaixo de',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: '6px',
  letterSpacing: '-0.01em',
};

export default function AlertsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const queryClient = useQueryClient();
  const { data: accounts, isLoading: accountsLoading } = useMetaAccounts();

  const [formData, setFormData] = useState({
    name: '',
    conditionType: 'roas_below',
    conditionValue: { threshold: 2.0 },
    telegramEnabled: false,
    telegramChatId: '',
  });

  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const { data: rulesResponse, isLoading: rulesLoading } = useQuery({
    queryKey: ['alerts', selectedAccountId],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/alerts');
      if (!res.ok) throw new Error('Falha ao carregar regras');
      return res.json();
    },
    enabled: !!selectedAccountId,
  });

  const rules: AlertRule[] = rulesResponse?.rules || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId || !formData.name) throw new Error('Preencha todos os campos obrigatórios');
      const res = await authenticatedFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          accountId: selectedAccountId,
          name: formData.name,
          conditionType: formData.conditionType,
          conditionValue: formData.conditionValue,
          telegramEnabled: formData.telegramEnabled,
          telegramChatId: formData.telegramChatId,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Falha ao criar alerta'); }
      return res.json();
    },
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Regra criada com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setFormData({ name: '', conditionType: 'roas_below', conditionValue: { threshold: 2.0 }, telegramEnabled: false, telegramChatId: '' });
      setShowForm(false);
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao criar alerta' });
    },
  });

  return (
    <DashboardLayout title="Alertas">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Alertas', href: '/alerts' }]} />

      <div style={{ padding: '16px 24px 24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
              Alertas
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
              Regras verificadas a cada 15 minutos
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Account selector */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                disabled={accountsLoading}
                className="input"
                style={{ width: '200px', paddingRight: '32px', appearance: 'none', cursor: 'pointer' }}
                aria-label="Selecionar conta"
              >
                <option value="">Todas as contas</option>
                {accounts?.map(a => <option key={a.id} value={a.id}>{a.meta_account_name}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
            </div>

            <button
              onClick={() => setShowForm(v => !v)}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '7px 14px' }}
              aria-expanded={showForm}
            >
              {showForm ? <><X size={13} aria-hidden="true" /> Cancelar</> : <><Plus size={13} aria-hidden="true" /> Nova Regra</>}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {feedback.text}
            </p>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', margin: '0 0 18px' }}>
              Nova Regra de Alerta
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="alert-name" style={fieldLabel}>Nome da regra <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input id="alert-name" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ex: ROAS Baixo" className="input" />
              </div>

              <div>
                <label htmlFor="alert-condition" style={fieldLabel}>Condição <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <select id="alert-condition" value={formData.conditionType} onChange={e => setFormData({ ...formData, conditionType: e.target.value })} className="input" style={{ paddingRight: '32px', appearance: 'none', cursor: 'pointer' }}>
                    {Object.entries(CONDITION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
                </div>
              </div>

              <div>
                <label htmlFor="alert-threshold" style={fieldLabel}>Valor limite <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input id="alert-threshold" type="number" value={formData.conditionValue.threshold || 0} onChange={e => setFormData({ ...formData, conditionValue: { threshold: Number(e.target.value) } })} step="0.01" className="input" />
              </div>

              <div style={{ paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.telegramEnabled} onChange={e => setFormData({ ...formData, telegramEnabled: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-primary)' }}>Enviar para Telegram</span>
                </label>

                {formData.telegramEnabled && (
                  <div style={{ marginTop: '12px' }}>
                    <label htmlFor="telegram-id" style={fieldLabel}>Chat ID do Telegram</label>
                    <input id="telegram-id" type="text" value={formData.telegramChatId} onChange={e => setFormData({ ...formData, telegramChatId: e.target.value })} placeholder="ex: -100123456789" className="input" />
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '5px' }}>
                      Obtenha seu Chat ID via @userinfobot no Telegram
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}>
                  Cancelar
                </button>
                <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}
                  aria-busy={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar Regra'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-sidebar)' }}>
                {['Nome', 'Condição', 'Limite', 'Telegram', 'Status'].map(h => (
                  <th key={h} className="col-header" style={{ padding: '0 16px', height: '36px', textAlign: 'left', verticalAlign: 'middle' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rulesLoading ? (
                <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Carregando regras...</td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Nenhuma regra criada ainda</td></tr>
              ) : rules.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border)', height: '44px' }}>
                  <td style={{ padding: '0 16px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{rule.name}</td>
                  <td style={{ padding: '0 16px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{CONDITION_LABELS[rule.condition_type] || rule.condition_type}</td>
                  <td style={{ padding: '0 16px' }}><span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>{rule.condition_value.threshold}</span></td>
                  <td style={{ padding: '0 16px' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: rule.telegram_enabled ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                      {rule.telegram_enabled ? 'Ativo' : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0 16px' }}>
                    <span className={rule.enabled ? 'badge-active' : 'badge-off'}>{rule.enabled ? 'Ativo' : 'Inativo'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <p style={{ marginTop: '12px', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
          Regras verificadas automaticamente a cada 15 min. Notificações enviadas ao dashboard e, se habilitado, ao Telegram.
        </p>
      </div>
    </DashboardLayout>
  );
}
