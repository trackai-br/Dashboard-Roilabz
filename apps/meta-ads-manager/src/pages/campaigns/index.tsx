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

const statusBadge: Record<string, string> = {
  ACTIVE:   'badge-active',
  PAUSED:   'badge-paused',
  ARCHIVED: 'badge-off',
};
const statusLabel: Record<string, string> = {
  ACTIVE:   'Ativo',
  PAUSED:   'Pausado',
  ARCHIVED: 'Arquivado',
};

const COLS = [
  { label: 'Campanha',     align: 'left'  },
  { label: 'Status',       align: 'left'  },
  { label: 'Gasto',        align: 'right' },
  { label: 'Impressões',   align: 'right' },
  { label: 'Cliques',      align: 'right' },
  { label: 'CPC',          align: 'right' },
  { label: 'CPM',          align: 'right' },
  { label: 'CTR',          align: 'right' },
  { label: 'Conversões',   align: 'right' },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

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

  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const campaigns = campaignsResponse?.campaigns || [];
  const syncStatuses: SyncStatus[] = campaignsResponse?.syncStatus || [];

  const lastSync = syncStatuses.find(
    (s) => s.sync_type === 'insights' && s.meta_account_id === selectedAccountId
  );

  const formatSyncTime = (isoDate: string | null) => {
    if (!isoDate) return 'Nunca';
    return new Date(isoDate).toLocaleString('pt-BR');
  };

  const syncDotColor =
    lastSync?.last_sync_status === 'success'
      ? 'var(--color-success)'
      : lastSync?.last_sync_status === 'running'
      ? 'var(--color-warning)'
      : 'var(--color-text-tertiary)';

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campanhas', href: '/campaigns' },
        ]}
      />

      <div className="p-5">
        {/* Filters row */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <label
              htmlFor="account-select"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
            >
              Conta
            </label>
            <select
              id="account-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              disabled={accountsLoading}
              className="input"
              style={{ width: '220px' }}
            >
              <option value="">Todas as contas</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.meta_account_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sync status */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: syncDotColor }} />
            Último sync: {formatSyncTime(lastSync?.last_synced_at || null)}
            {lastSync?.last_sync_status === 'running' && ' (sincronizando...)'}
          </div>
        </div>

        {campaignsError && (
          <div className="mb-5 rounded p-3" style={{ backgroundColor: 'rgba(255,45,120,0.06)', border: '1px solid var(--color-danger)' }}>
            <p className="text-sm" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
              Erro ao carregar campanhas: {campaignsError instanceof Error ? campaignsError.message : 'Erro desconhecido'}
            </p>
          </div>
        )}

        {/* Table */}
        <div
          className="overflow-x-auto"
          style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-sidebar)' }}>
                {COLS.map(({ label, align }) => (
                  <th
                    key={label}
                    className={`px-4 text-${align} col-header`}
                    style={{ height: '36px', verticalAlign: 'middle' }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaignsLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Carregando campanhas...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Nenhuma campanha encontrada
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign: Campaign) => (
                  <tr
                    key={campaign.campaign_id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border)', height: '44px' }}
                    onClick={() => router.push(`/campaigns/${campaign.campaign_id}`)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-row-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td className="px-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
                      <Link
                        href={`/campaigns/${campaign.campaign_id}`}
                        className="hover:underline"
                        style={{ color: 'var(--color-text-primary)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {campaign.campaign_name}
                      </Link>
                    </td>
                    <td className="px-4">
                      <span className={statusBadge[campaign.status] || 'badge-off'}>
                        {statusLabel[campaign.status] || campaign.status}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        R${(Number(campaign.metrics?.spend || 0) / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        {Number(campaign.metrics?.impressions || 0).toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        {Number(campaign.metrics?.clicks || 0).toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        R${(Number(campaign.metrics?.cpc || 0) / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        R${(Number(campaign.metrics?.cpm || 0) / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        {Number(campaign.metrics?.ctr || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        {Number(campaign.metrics?.conversions || 0).toLocaleString('pt-BR')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {campaigns.length > 0 && (
          <div className="mt-4">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>
              {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} encontrada{campaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
