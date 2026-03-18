import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useQuery } from '@tanstack/react-query';

interface Ad {
  id: string;
  ad_id: string;
  adset_id: string;
  name: string;
  status: string;
  creative_id?: string;
  created_at?: string;
}

export default function AdSetDetailPage() {
  const router = useRouter();
  const { campaignId, adSetId } = router.query;

  const {
    data: adsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ads', adSetId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/ads?adsetId=${adSetId}`);
      if (!res.ok) throw new Error('Failed to fetch ads');
      return res.json();
    },
    enabled: !!adSetId,
  });

  const ads = adsResponse?.ads || [];

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: 'Accounts', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          {
            label: `Campaign ${campaignId?.toString().slice(0, 8)}...`,
            href: `/campaigns/${campaignId}`,
          },
          {
            label: `Ad Set ${adSetId?.toString().slice(0, 8)}...`,
            href: `/campaigns/${campaignId}/adsets/${adSetId}`,
          },
        ]}
      />

      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Ads for Ad Set {adSetId?.toString().slice(0, 8)}...
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading ads: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Ads Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Ad Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                  Creative ID
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
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading ads...
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No ads found for this ad set
                  </td>
                </tr>
              ) : (
                ads.map((ad: Ad) => (
                  <tr
                    key={ad.ad_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {ad.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          ad.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {ad.creative_id ? ad.creative_id.slice(0, 8) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {ad.created_at
                        ? new Date(ad.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {ads.length > 0 && (
          <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <strong>{ads.length}</strong> ad{ads.length !== 1 ? 's' : ''} for
              this ad set
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
