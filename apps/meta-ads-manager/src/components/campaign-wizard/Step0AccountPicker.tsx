import React from 'react';
import Link from 'next/link';
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
        <p style={{ color: 'var(--color-secondary)' }}>Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-500/30" style={{ backgroundColor: 'rgba(255, 51, 51, 0.1)' }}>
        <p style={{ color: '#ff3333' }}>⚠️ Error loading accounts: {error.message}</p>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--neon-green)' }}>
            Select an Account
          </h2>
          <p style={{ color: 'var(--color-secondary)' }} className="text-sm mb-6">
            Choose the Meta Ads account where you want to create your campaign.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-cyan-500/30" style={{ backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
          <p style={{ color: 'var(--neon-cyan)' }} className="mb-4">
            📊 No accounts found. Please sync your Meta Ads accounts first.
          </p>
          <Link
            href="/campaigns"
            className="inline-block px-4 py-2 rounded-lg font-medium transition hover:shadow-lg"
            style={{
              backgroundColor: 'var(--neon-green)',
              color: '#000',
            }}
          >
            Go to Sync Accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--neon-green)' }}>
          Select an Account
        </h2>
        <p style={{ color: 'var(--color-secondary)' }} className="text-sm">
          Choose the Meta Ads account where you want to create your campaign.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: MetaAccount) => (
          <div
            key={account.id}
            onClick={() => onSelectAccount(account.id, account.meta_account_name)}
            className="p-4 rounded-lg border cursor-pointer transition hover:shadow-lg"
            style={{
              backgroundColor: selectedAccountId === account.id ? 'rgba(57, 255, 20, 0.1)' : 'var(--bg-card)',
              borderColor: selectedAccountId === account.id ? 'var(--neon-green)' : 'rgba(57, 255, 20, 0.2)',
              borderWidth: '2px',
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {account.meta_account_name}
                </h3>
                <p style={{ color: 'var(--color-secondary)' }} className="text-xs">
                  {account.meta_account_id}
                </p>
              </div>
              {selectedAccountId === account.id && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--neon-green)' }}>
                  <span style={{ color: '#000' }} className="text-xs font-bold">✓</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4" style={{ borderTopColor: 'rgba(57, 255, 20, 0.2)', borderTopWidth: '1px' }}>
              <div>
                <p style={{ color: 'var(--color-secondary)' }} className="text-xs">Currency</p>
                <p style={{ color: 'var(--color-primary)' }} className="text-sm font-medium">
                  {account.currency}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--color-secondary)' }} className="text-xs">Timezone</p>
                <p style={{ color: 'var(--color-primary)' }} className="text-sm font-medium">
                  {account.timezone}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg border border-cyan-500/30" style={{ backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
        <p style={{ color: 'var(--neon-cyan)' }} className="text-sm">
          💡 <strong>Tip:</strong> You can create campaigns for multiple accounts. Just come back here to switch accounts.
        </p>
      </div>
    </div>
  );
}
