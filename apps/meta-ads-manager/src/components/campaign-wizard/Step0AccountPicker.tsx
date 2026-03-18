import React from 'react';
import { useMetaAccounts, MetaAccount } from '../../hooks/useMetaAccounts';

interface Step0AccountPickerProps {
  selectedAccountId: string;
  onSelectAccount: (accountId: string, accountName: string) => void;
}

export function Step0AccountPicker({ selectedAccountId, onSelectAccount }: Step0AccountPickerProps) {
  const { data: accounts, isLoading, error } = useMetaAccounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50">
        <p className="text-red-700">Error loading accounts: {error.message}</p>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-yellow-50">
        <p className="text-yellow-700">No accounts found. Please sync your Meta accounts first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
          Select an Account
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Choose the Meta Ads account where you want to create your campaign.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: MetaAccount) => (
          <div
            key={account.id}
            onClick={() => onSelectAccount(account.id, account.meta_account_name)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition ${
              selectedAccountId === account.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{account.meta_account_name}</h3>
                <p className="text-xs text-gray-500">{account.meta_account_id}</p>
              </div>
              {selectedAccountId === account.id && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Currency</p>
                <p className="text-sm font-medium text-gray-900">{account.currency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Timezone</p>
                <p className="text-sm font-medium text-gray-900">{account.timezone}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-info)' }}>
          💡 <strong>Tip:</strong> You can create campaigns for multiple accounts. Just come back here
          to switch accounts.
        </p>
      </div>
    </div>
  );
}
