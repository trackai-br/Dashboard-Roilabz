import React from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { useMetaAccounts, MetaAccount } from '@/hooks/useMetaAccounts';

export default function Tab1Accounts() {
  const { state, dispatch } = useWizard();
  const { data: accounts, isLoading, error } = useMetaAccounts();

  const toggleAccount = (id: string) => {
    dispatch({ type: 'TOGGLE_ACCOUNT', payload: id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-secondary)' }}>
          Carregando contas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 51, 51, 0.1)', border: '1px solid rgba(255, 51, 51, 0.3)' }}>
        <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
          Erro ao carregar contas: {error.message}
        </p>
      </div>
    );
  }

  const accountList = accounts || [];

  if (accountList.length === 0) {
    return (
      <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)' }}>
        <p style={{ color: 'var(--color-warning)' }}>
          Nenhuma conta sincronizada. Volte à tela anterior e clique em Sincronizar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3
        className="text-lg font-bold mb-1"
        style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
      >
        Selecione as Contas de Anúncio
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--color-secondary)' }}>
        Escolha as contas onde as campanhas serão publicadas
      </p>

      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
        style={{
          backgroundColor: state.selectedAccountIds.length > 0
            ? 'rgba(57, 255, 20, 0.1)'
            : 'rgba(112, 112, 128, 0.1)',
          border: `1px solid ${state.selectedAccountIds.length > 0 ? 'rgba(57, 255, 20, 0.3)' : 'rgba(112, 112, 128, 0.3)'}`,
          color: state.selectedAccountIds.length > 0 ? 'var(--neon-green)' : 'var(--color-tertiary)',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        {state.selectedAccountIds.length} {state.selectedAccountIds.length === 1 ? 'conta selecionada' : 'contas selecionadas'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {accountList.map((account: MetaAccount) => {
          const isSelected = state.selectedAccountIds.includes(account.meta_account_id);
          return (
            <button
              key={account.meta_account_id}
              onClick={() => toggleAccount(account.meta_account_id)}
              className="p-4 rounded-lg border text-left transition-all duration-150"
              style={{
                backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                borderColor: isSelected ? 'rgba(57, 255, 20, 0.5)' : 'var(--border-light)',
                boxShadow: isSelected ? '0 0 12px rgba(57, 255, 20, 0.15)' : 'none',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: isSelected ? 'var(--neon-green)' : 'var(--color-primary)' }}
                  >
                    {account.meta_account_name || 'Sem nome'}
                  </p>
                  <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-tertiary)' }}>
                    {account.meta_account_id}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-tertiary)' }}>
                    {account.currency || 'USD'}
                  </p>
                </div>
                {isSelected && (
                  <svg className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: 'var(--neon-green)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
