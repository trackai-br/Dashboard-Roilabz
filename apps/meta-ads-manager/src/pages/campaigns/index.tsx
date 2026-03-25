import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';
import Link from 'next/link';

interface Campaign {
  id: string;
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective: string;
  start_time?: string;
  end_time?: string;
  metrics?: {
    spend: string;
    impressions: string;
    clicks: string;
    cpc?: string;
    cpm?: string;
    ctr?: string;
    conversions?: string;
    roas?: string;
  };
}

interface SyncStatus {
  meta_account_id: string;
  sync_type: string;
  last_synced_at: string | null;
  last_sync_status: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Queries
  const { data: accounts, isLoading: accountsLoading } = useMetaAccounts();

  const {
    data: campaignsResponse,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useQuery({
    queryKey: ['campaigns', selectedAccountId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedAccountId) params.append('accountId', selectedAccountId);

      const res = await authenticatedFetch(`/api/meta/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
    enabled: !!selectedAccountId || accounts?.length === 0,
  });

  // Set default account on load
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const campaigns = campaignsResponse?.campaigns || [];
  const syncStatuses: SyncStatus[] = campaignsResponse?.syncStatus || [];

  // Find most recent sync for selected account
  const lastSync = syncStatuses.find(
    (s) => s.sync_type === 'insights' && s.meta_account_id === selectedAccountId
  );

  const formatSyncTime = (isoDate: string | null) => {
    if (!isoDate) return 'Never';
    const d = new Date(isoDate);
    return d.toLocaleString();
  };

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: 'Accounts', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
        ]}
      />

      <div className="p-6">
        {/* Account Selector + Sync Status */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <label
              htmlFor="account-select"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-primary)' }}
            >
              Select Account
            </label>
            <select
              id="account-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={accountsLoading}
              className="input rounded-lg px-4 py-2 disabled:opacity-50"
            >
              <option value="">All Accounts</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.meta_account_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sync Status Indicator */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  lastSync?.last_sync_status === 'success'
                    ? 'var(--color-success)'
                    : lastSync?.last_sync_status === 'running'
                    ? 'var(--color-warning, #f59e0b)'
                    : 'var(--color-secondary)',
              }}
            />
            <span>
              Last sync: {formatSyncTime(lastSync?.last_synced_at || null)}
              {lastSync?.last_sync_status === 'running' && ' (syncing...)'}
            </span>
          </div>
        </div>

        {campaignsError && (
          <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
              Error loading campaigns: {campaignsError instanceof Error ? campaignsError.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Campaigns Table */}
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-tertiary)' }}>
          <table className="min-w-full divide-y" style={{ backgroundColor: 'var(--bg-card)' }}>
            <thead style={{ backgroundColor: 'var(--bg-table-header)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Campaign Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Spend
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Impressions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  CPC
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  CPM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  CTR
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Conversions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-tertiary)' }}>
              {campaignsLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    No campaigns found
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign: Campaign) => (
                  <tr
                    key={campaign.campaign_id}
                    className="cursor-pointer transition-colors"
                    onClick={() => router.push(`/campaigns/${campaign.campaign_id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-brand)' }}>
                      <Link
                        href={`/campaigns/${campaign.campaign_id}`}
                        className="hover:underline"
                        style={{ color: 'var(--color-brand)' }}
                      >
                        {campaign.campaign_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: campaign.status === 'ACTIVE' ? 'var(--color-success-bg)' : 'var(--bg-tertiary)',
                          color: campaign.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-secondary)'
                        }}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      ${(Number(campaign.metrics?.spend || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      {Number(campaign.metrics?.impressions || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      {Number(campaign.metrics?.clicks || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      ${(Number(campaign.metrics?.cpc || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      ${(Number(campaign.metrics?.cpm || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      {Number(campaign.metrics?.ctr || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      {Number(campaign.metrics?.conversions || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {campaigns.length > 0 && (
          <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)', borderWidth: '1px' }}>
            <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
              Showing <strong>{campaigns.length}</strong> campaign
              {campaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
