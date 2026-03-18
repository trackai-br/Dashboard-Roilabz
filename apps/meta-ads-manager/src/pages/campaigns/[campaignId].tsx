import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useQuery } from '@tanstack/react-query';

interface AdSet {
  id: string;
  adset_id: string;
  campaign_id: string;
  name: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  created_at?: string;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { campaignId } = router.query;
  const [darkMode, setDarkMode] = useState(false);

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

  const {
    data: adsetsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adsets', campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/adsets?campaignId=${campaignId}`);
      if (!res.ok) throw new Error('Failed to fetch ad sets');
      return res.json();
    },
    enabled: !!campaignId,
  });

  const adsets = adsetsResponse?.adsets || [];

  return (
    <DashboardLayout darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle}>
      <Breadcrumb
        items={[
          { label: 'Accounts', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: `Campaign ${campaignId?.toString().slice(0, 8)}...`, href: `/campaigns/${campaignId}` },
        ]}
        darkMode={darkMode}
      />

      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Ad Sets for Campaign {campaignId?.toString().slice(0, 8)}...
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading ad sets: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Ad Sets Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Ad Set Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Daily Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Lifetime Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading ad sets...
                  </td>
                </tr>
              ) : adsets.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No ad sets found for this campaign
                  </td>
                </tr>
              ) : (
                adsets.map((adset: AdSet) => (
                  <tr
                    key={adset.adset_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(
                        `/campaigns/${campaignId}/adsets/${adset.adset_id}`
                      )
                    }
                  >
                    <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {adset.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          adset.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {adset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {adset.daily_budget ? `$${(adset.daily_budget / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {adset.lifetime_budget ? `$${(adset.lifetime_budget / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {adset.created_at
                        ? new Date(adset.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {adsets.length > 0 && (
          <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <strong>{adsets.length}</strong> ad set
              {adsets.length !== 1 ? 's' : ''} for this campaign
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
