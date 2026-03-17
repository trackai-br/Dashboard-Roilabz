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
  const [darkMode, setDarkMode] = useState(false);
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

  // Load dark mode
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', JSON.stringify(enabled));
  };

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

  const inputClass = darkMode
    ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-white'
    : 'bg-white border-gray-300 text-gray-900';

  return (
    <DashboardLayout darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle}>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Alertas', href: '/alerts' },
        ]}
        darkMode={darkMode}
      />

      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sistema de Alertas
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Crie regras para ser notificado sobre mudanças nas suas campanhas
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {showForm ? '✕ Cancelar' : '+ Nova Regra'}
          </button>
        </div>

        {/* Account Selector */}
        <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecionar Conta
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={accountsLoading}
            className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
          >
            <option value="">Todas as contas</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              Nova Regra de Alerta
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Regra *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: ROAS Baixo"
                  className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Condição *
                </label>
                <select
                  value={formData.conditionType}
                  onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                  className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
                >
                  <option value="roas_below">ROAS Abaixo de</option>
                  <option value="daily_spend_above">Gasto Diário Acima de</option>
                  <option value="cpc_above">CPC Acima de</option>
                  <option value="ctr_below">CTR Abaixo de</option>
                  <option value="conversion_rate_below">Taxa de Conversão Abaixo de</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enviar para Telegram
                    </span>
                  </label>

                  {formData.telegramEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chat ID do Telegram
                      </label>
                      <input
                        type="text"
                        value={formData.telegramChatId}
                        onChange={(e) =>
                          setFormData({ ...formData, telegramChatId: e.target.value })
                        }
                        placeholder="seu-chat-id"
                        className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        💡 Obtenha seu Chat ID conversando com @userinfobot no Telegram
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createAlertMutation.mutate()}
                  disabled={createAlertMutation.isPending}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {createAlertMutation.isPending ? 'Criando...' : 'Criar Regra'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Telegram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {rulesLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Carregando regras...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma regra criada
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {rule.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {rule.condition_type === 'roas_below' && 'ROAS Abaixo'}
                      {rule.condition_type === 'daily_spend_above' && 'Gasto Acima'}
                      {rule.condition_type === 'cpc_above' && 'CPC Acima'}
                      {rule.condition_type === 'ctr_below' && 'CTR Abaixo'}
                      {rule.condition_type === 'conversion_rate_below' && 'Taxa Conversão Abaixo'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {rule.condition_value.threshold}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {rule.telegram_enabled ? (
                        <span className="text-green-600 dark:text-green-400">✓ Ativo</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          rule.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
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
        <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Dica:</strong> As regras de alerta são verificadas a cada 15 minutos.
            Você receberá notificações no dashboard e, se habilitado, no Telegram.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
