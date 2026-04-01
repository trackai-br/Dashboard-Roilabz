import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

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
  { label: 'Campanha',   align: 'left'  },
  { label: 'Status',     align: 'left'  },
  { label: 'Gasto',      align: 'right' },
  { label: 'Impressões', align: 'right' },
  { label: 'Cliques',    align: 'right' },
  { label: 'CPC',        align: 'right' },
  { label: 'CPM',        align: 'right' },
  { label: 'CTR',        align: 'right' },
  { label: 'Conversões', align: 'right' },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const { data: accounts, isLoading: accountsLoading } = useMetaAccounts();

  const { data: campaignsResponse, isLoading: campaignsLoading, error: campaignsError } = useQuery({
    queryKey: ['campaigns', selectedAccountId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedAccountId) params.append('accountId', selectedAccountId);
      const res = await authenticatedFetch(`/api/meta/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar campanhas');
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
  const lastSync = syncStatuses.find(s => s.sync_type === 'insights' && s.meta_account_id === selectedAccountId);

  const syncDotColor =
    lastSync?.last_sync_status === 'success' ? 'var(--color-success)' :
    lastSync?.last_sync_status === 'running'  ? 'var(--color-warning)' :
    'var(--color-text-tertiary)';

  const formatSyncTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('pt-BR') : 'Nunca';

  return (
    <DashboardLayout title="Campanhas">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Campanhas', href: '/campaigns' }]} />

      <div style={{ padding: '16px 24px 24px' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>

          {/* Account selector */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <label
              htmlFor="account-select"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-tertiary)', marginRight: '8px' }}
            >
              Conta
            </label>
            <select
              id="account-select"
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              disabled={accountsLoading}
              className="input"
              style={{ width: '220px', paddingRight: '32px', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Todas as contas</option>
              {accounts?.map(account => (
                <option key={account.id} value={account.id}>
                  {account.meta_account_name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }} />
          </div>

          {/* Sync status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: syncDotColor, display: 'inline-block', flexShrink: 0 }} />
            Último sync: {formatSyncTime(lastSync?.last_synced_at || null)}
            {lastSync?.last_sync_status === 'running' && ' (sincronizando...)'}
          </div>
        </div>

        {/* Error */}
        {campaignsError && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-danger)' }}>
              {campaignsError instanceof Error ? campaignsError.message : 'Erro desconhecido'}
            </p>
          </div>
        )}

        {/* Table */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-sidebar)' }}>
                  {COLS.map(({ label, align }) => (
                    <th
                      key={label}
                      className="col-header"
                      style={{ padding: '0 16px', height: '36px', textAlign: align as 'left' | 'right', verticalAlign: 'middle' }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignsLoading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                      Carregando campanhas...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                      Nenhuma campanha encontrada
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign: Campaign) => (
                    <tr
                      key={campaign.campaign_id}
                      style={{ borderBottom: '1px solid var(--color-border)', height: '44px', cursor: 'pointer', transition: 'background-color 80ms ease' }}
                      onClick={() => router.push(`/campaigns/${campaign.campaign_id}`)}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-bg-row-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '0 16px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        <Link
                          href={`/campaigns/${campaign.campaign_id}`}
                          onClick={e => e.stopPropagation()}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-accent-bright)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'inherit'; }}
                        >
                          {campaign.campaign_name}
                        </Link>
                      </td>
                      <td style={{ padding: '0 16px' }}>
                        <span className={statusBadge[campaign.status] || 'badge-off'}>
                          {statusLabel[campaign.status] || campaign.status}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', textAlign: 'right' }}>
                        <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                          R${(Number(campaign.metrics?.spend || 0) / 100).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', textAlign: 'right' }}>
                        <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                          {Number(campaign.metrics?.impressions || 0).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', textAlign: 'right' }}>
                        <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                          {Number(campaign.metrics?.clicks || 0).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', textAlign: 'right' }}>
                        <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                          R${(Number(campaign.metrics?.cpc || 0) / 100).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', textAlign: 'right' }}>
                        <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                          R${(Number(campaign.metrics?.cpm || 0) / 100).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', textAlign: 'right' }}>
                        <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                          {Number(campaign.metrics?.ctr || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '0 16px', textAlign: 'right' }}>
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
        </div>

        {/* Count */}
        {campaigns.length > 0 && (
          <p style={{ marginTop: '10px', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} encontrada{campaigns.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
