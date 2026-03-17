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
  const [darkMode, setDarkMode] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateStop, setDateStop] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Load dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
    }
  }, []);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', JSON.stringify(enabled));
  };

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
    <DashboardLayout darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle}>
      <Breadcrumb
        items={[
          { label: 'Accounts', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
        ]}
        darkMode={darkMode}
      />

      <div className="p-6">
        {/* Account Selector */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
          <div>
            <label
              htmlFor="account-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Select Account
            </label>
            <select
              id="account-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={accountsLoading}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white disabled:opacity-50"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Start Date
              </label>
              <input
                id="date-start"
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="date-stop"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                End Date
              </label>
              <input
                id="date-stop"
                type="date"
                value={dateStop}
                onChange={(e) => setDateStop(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {campaignsError && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading campaigns: {campaignsError instanceof Error ? campaignsError.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Campaigns Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Campaign Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Spend
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Impressions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  CPC
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  CPM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Link Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Landing Page Views
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {campaignsLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No campaigns found
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr
                    key={campaign.campaign_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => router.push(`/campaigns/${campaign.campaign_id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <Link href={`/campaigns/${campaign.campaign_id}`}>
                        <a className="hover:text-blue-600 dark:hover:text-blue-400">
                          {campaign.campaign_name}
                        </a>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      ${(Number(campaign.metrics?.spend || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {Number(campaign.metrics?.impressions || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {Number(campaign.metrics?.clicks || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      ${(Number(campaign.metrics?.cpc || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      ${(Number(campaign.metrics?.cpm || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {Number(campaign.metrics?.inline_link_clicks || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
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
          <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
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
