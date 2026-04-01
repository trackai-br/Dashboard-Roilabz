import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  account_id: string;
  account_name?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  roas: number;
  updated_at: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
  loading?: boolean;
  error?: string | null;
  accountSelector?: React.ReactNode;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

type SortColumn = 'name' | 'status' | 'spend' | 'impressions' | 'clicks' | 'cpc' | 'roas' | null;
type SortDirection = 'asc' | 'desc';

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

export const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  loading = false,
  error = null,
  accountSelector,
  onSort,
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedCampaigns = useMemo(() => {
    if (!sortColumn || campaigns.length === 0) return campaigns;
    return [...campaigns].sort((a, b) => {
      const aVal = a[sortColumn as keyof Campaign];
      const bVal = b[sortColumn as keyof Campaign];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [campaigns, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    const nextDir = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(nextDir);
    if (onSort && column) onSort(column, nextDir);
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ChevronsUpDown size={12} style={{ color: 'var(--color-text-tertiary)' }} />;
    return sortDirection === 'asc'
      ? <ChevronUp size={12} style={{ color: 'var(--color-accent)' }} />
      : <ChevronDown size={12} style={{ color: 'var(--color-accent)' }} />;
  };

  const ColHeader = ({ label, column }: { label: string; column: SortColumn }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 col-header cursor-pointer transition-colors hover:text-white focus:outline-none"
    >
      {label}
      <SortIcon column={column} />
    </button>
  );

  if (error) {
    return (
      <div className="rounded-lg p-4" style={{ border: '1px solid var(--color-danger)', backgroundColor: 'rgba(255,45,120,0.06)' }}>
        <p className="text-sm" style={{ color: 'var(--color-danger)' }}>Erro ao carregar campanhas: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accountSelector && <div className="flex items-center gap-3">{accountSelector}</div>}

      <div
        className="overflow-x-auto"
        style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {[
                { label: 'Conta',      column: null as SortColumn,        align: 'left'  },
                { label: 'Campanha',   column: 'name' as SortColumn,      align: 'left'  },
                { label: 'Status',     column: 'status' as SortColumn,    align: 'left'  },
                { label: 'Gasto',      column: 'spend' as SortColumn,     align: 'right' },
                { label: 'Impressões', column: 'impressions' as SortColumn, align: 'right' },
                { label: 'Cliques',    column: 'clicks' as SortColumn,    align: 'right' },
                { label: 'CPC',        column: 'cpc' as SortColumn,       align: 'right' },
                { label: 'ROAS',       column: 'roas' as SortColumn,      align: 'right' },
                { label: 'Atualizado', column: null as SortColumn,        align: 'left'  },
              ].map(({ label, column, align }) => (
                <th
                  key={label}
                  className={`px-4 text-${align}`}
                  style={{ height: '36px', verticalAlign: 'middle', backgroundColor: 'var(--color-bg-sidebar)' }}
                >
                  <ColHeader label={label} column={column} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4" style={{ height: '44px' }}>
                      <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: 'var(--color-bg-input)' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Nenhuma campanha encontrada
                </td>
              </tr>
            ) : (
              sortedCampaigns.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid var(--color-border)', height: '44px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-row-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td className="px-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {c.account_name || c.account_id}
                  </td>
                  <td className="px-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {c.name}
                  </td>
                  <td className="px-4">
                    <span className={statusBadge[c.status] || 'badge-off'}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-4 text-right">
                    <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                      R${c.spend.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 text-right">
                    <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                      {c.impressions.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-4 text-right">
                    <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                      {c.clicks.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-4 text-right">
                    <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                      R${c.cpc.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 text-right">
                    <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                      {c.roas.toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    {new Date(c.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
