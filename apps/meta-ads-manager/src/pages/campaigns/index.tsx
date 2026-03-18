import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useQuery } from '@tanstack/react-query';
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
    date_start: string;
    date_stop: string;
    spend: string;
    impressions: string;
    clicks: string;
    cpc?: string;
    cpm?: string;
    ctr?: string;
    inline_link_clicks?: string;
    landing_page_views?: string;
    cost_per_inline_link_click?: string;
    cost_per_landing_page_view?: string;
    actions?: Array<{ action_type: string; value: string }>;
  };
}

export default function CampaignsPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateStop, setDateStop] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Queries
  const { data: accounts, isLoading: accountsLoading } = useMetaAccounts();

  const {
    data: campaignsResponse,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useQuery({
    queryKey: ['campaigns', selectedAccountId, dateStart, dateStop],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedAccountId) params.append('accountId', selectedAccountId);
      params.append('dateStart', dateStart);
      params.append('dateStop', dateStop);

      const res = await fetch(`/api/meta/campaigns?${params.toString()}`);
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

  const getActionValue = (campaign: Campaign, actionType: string) => {
    if (!campaign.metrics?.actions) return '0';
    const action = campaign.metrics.actions.find(
      (a) => a.action_type === actionType
    );
    return action?.value || '0';
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
        {/* Account Selector */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
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
                  {account.account_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Picker */}
          <div className="flex gap-4">
            <div>
              <label
                htmlFor="date-start"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-primary)' }}
              >
                Start Date
              </label>
              <input
                id="date-start"
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="input rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="date-stop"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-primary)' }}
              >
                End Date
              </label>
              <input
                id="date-stop"
                type="date"
                value={dateStop}
                onChange={(e) => setDateStop(e.target.value)}
                className="input rounded-lg px-4 py-2"
              />
            </div>
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
                  Link Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Landing Page Views
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
                      {Number(campaign.metrics?.inline_link_clicks || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono" style={{ color: 'var(--color-primary)' }}>
                      {Number(campaign.metrics?.landing_page_views || 0).toLocaleString()}
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
              {campaigns.length !== 1 ? 's' : ''} from{' '}
              <strong>{dateStart}</strong> to <strong>{dateStop}</strong>
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
