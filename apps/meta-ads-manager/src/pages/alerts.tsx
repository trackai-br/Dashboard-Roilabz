import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export default function AlertsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: accounts, isLoading: accountsLoading } = useMetaAccounts();

  const [formData, setFormData] = useState({
    name: '',
    conditionType: 'roas_below',
    conditionValue: { threshold: 2.0 },
    telegramEnabled: false,
    telegramChatId: '',
  });

  // Set default account
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Fetch alert rules
  const {
    data: rulesResponse,
    isLoading: rulesLoading,
    error: rulesError,
  } = useQuery({
    queryKey: ['alerts', selectedAccountId],
    queryFn: async () => {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Falha ao carregar regras');
      return res.json();
    },
    enabled: !!selectedAccountId,
  });

  const rules = rulesResponse?.rules || [];

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId || !formData.name) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          name: formData.name,
          conditionType: formData.conditionType,
          conditionValue: formData.conditionValue,
          telegramEnabled: formData.telegramEnabled,
          telegramChatId: formData.telegramChatId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao criar alerta');
      }

      return res.json();
    },
    onSuccess: () => {
      setSuccess('Regra de alerta criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setFormData({
        name: '',
        conditionType: 'roas_below',
        conditionValue: { threshold: 2.0 },
        telegramEnabled: false,
        telegramChatId: '',
      });
      setShowForm(false);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao criar alerta');
    },
  });

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Alertas', href: '/alerts' },
        ]}
      />

      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display" style={{ color: 'var(--color-primary)' }}>
              Sistema de Alertas
            </h1>
            <p className="mt-2" style={{ color: 'var(--color-secondary)' }}>
              Crie regras para ser notificado sobre mudanças nas suas campanhas
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg px-6 py-2 font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            {showForm ? '✕ Cancelar' : '+ Nova Regra'}
          </button>
        </div>

        {/* Account Selector */}
        <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
            Selecionar Conta
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={accountsLoading}
            className="input w-full rounded-lg px-4 py-2"
          >
            <option value="">Todas as contas</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.meta_account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--color-success-bg)', borderColor: 'var(--color-success)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>{success}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
            <h2 className="mb-6 text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>
              Nova Regra de Alerta
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                  Nome da Regra *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: ROAS Baixo"
                  className="input w-full rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                  Tipo de Condição *
                </label>
                <select
                  value={formData.conditionType}
                  onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                  className="input w-full rounded-lg px-4 py-2"
                >
                  <option value="roas_below">ROAS Abaixo de</option>
                  <option value="daily_spend_above">Gasto Diário Acima de</option>
                  <option value="cpc_above">CPC Acima de</option>
                  <option value="ctr_below">CTR Abaixo de</option>
                  <option value="conversion_rate_below">Taxa de Conversão Abaixo de</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                  Valor Limite *
                </label>
                <input
                  type="number"
                  value={formData.conditionValue.threshold || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditionValue: { threshold: Number(e.target.value) },
                    })
                  }
                  placeholder="ex: 2.0"
                  step="0.01"
                  className="input w-full rounded-lg px-4 py-2"
                />
              </div>

              <div className="pt-6" style={{ borderTop: '1px solid var(--color-tertiary)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                  Notificações
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.telegramEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, telegramEnabled: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                      Enviar para Telegram
                    </span>
                  </label>

                  {formData.telegramEnabled && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                        Chat ID do Telegram
                      </label>
                      <input
                        type="text"
                        value={formData.telegramChatId}
                        onChange={(e) =>
                          setFormData({ ...formData, telegramChatId: e.target.value })
                        }
                        placeholder="seu-chat-id"
                        className="input w-full rounded-lg px-4 py-2"
                      />
                      <p className="mt-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
                        💡 Obtenha seu Chat ID conversando com @userinfobot no Telegram
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border px-4 py-2 font-medium"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createAlertMutation.mutate()}
                  disabled={createAlertMutation.isPending}
                  className="flex-1 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-brand)' }}
                >
                  {createAlertMutation.isPending ? 'Criando...' : 'Criar Regra'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-tertiary)' }}>
          <table className="w-full divide-y" style={{ backgroundColor: 'var(--bg-card)' }}>
            <thead style={{ backgroundColor: 'var(--bg-table-header)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Telegram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-tertiary)' }}>
              {rulesLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center" style={{ color: 'var(--color-secondary)' }}>
                    Carregando regras...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center" style={{ color: 'var(--color-secondary)' }}>
                    Nenhuma regra criada
                  </td>
                </tr>
              ) : (
                rules.map((rule: AlertRule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-primary)' }}>
                      {rule.name}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-primary)' }}>
                      {rule.condition_type === 'roas_below' && 'ROAS Abaixo'}
                      {rule.condition_type === 'daily_spend_above' && 'Gasto Acima'}
                      {rule.condition_type === 'cpc_above' && 'CPC Acima'}
                      {rule.condition_type === 'ctr_below' && 'CTR Abaixo'}
                      {rule.condition_type === 'conversion_rate_below' && 'Taxa Conversão Abaixo'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-primary)' }}>
                      {rule.condition_value.threshold}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {rule.telegram_enabled ? (
                        <span style={{ color: 'var(--color-success)' }}>✓ Ativo</span>
                      ) : (
                        <span style={{ color: 'var(--color-tertiary)' }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: rule.enabled ? 'var(--color-success-bg)' : 'var(--bg-tertiary)',
                          color: rule.enabled ? 'var(--color-success)' : 'var(--color-secondary)'
                        }}
                      >
                        {rule.enabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg p-4" style={{ backgroundColor: 'var(--color-info-bg)' }}>
          <p className="text-sm" style={{ color: 'var(--color-info)' }}>
            💡 <strong>Dica:</strong> As regras de alerta são verificadas a cada 15 minutos.
            Você receberá notificações no dashboard e, se habilitado, no Telegram.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
