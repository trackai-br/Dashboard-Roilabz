import React from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

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

  const {
    data: adsetsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adsets', campaignId],
    queryFn: async () => {
      const res = await authenticatedFetch(`/api/meta/adsets?campaignId=${campaignId}`);
      if (!res.ok) throw new Error('Failed to fetch ad sets');
      return res.json();
    },
    enabled: !!campaignId,
  });

  const adsets = adsetsResponse?.adsets || [];

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: 'Accounts', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: `Campaign ${campaignId?.toString().slice(0, 8)}...`, href: `/campaigns/${campaignId}` },
        ]}
      />

      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
          Ad Sets for Campaign {campaignId?.toString().slice(0, 8)}...
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
              Error loading ad sets: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Ad Sets Table */}
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-tertiary)' }}>
          <table className="min-w-full divide-y" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
            <thead style={{ backgroundColor: 'var(--bg-table-header)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Ad Set Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Daily Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Lifetime Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-tertiary)' }}>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Loading ad sets...
                  </td>
                </tr>
              ) : adsets.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    No ad sets found for this campaign
                  </td>
                </tr>
              ) : (
                adsets.map((adset: AdSet) => (
                  <tr
                    key={adset.adset_id}
                    className="cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(
                        `/campaigns/${campaignId}/adsets/${adset.adset_id}`
                      )
                    }
                  >
                    <td className="px-6 py-4 text-sm font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
                      {adset.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: adset.status === 'ACTIVE' ? 'var(--color-success-bg)' : 'var(--bg-tertiary)',
                          color: adset.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-secondary)'
                        }}
                      >
                        {adset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm" style={{ color: 'var(--color-primary)' }}>
                      {adset.daily_budget ? `$${(adset.daily_budget / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm" style={{ color: 'var(--color-primary)' }}>
                      {adset.lifetime_budget ? `$${(adset.lifetime_budget / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-primary)' }}>
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
          <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)', borderWidth: '1px' }}>
            <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
              Showing <strong>{adsets.length}</strong> ad set
              {adsets.length !== 1 ? 's' : ''} for this campaign
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
