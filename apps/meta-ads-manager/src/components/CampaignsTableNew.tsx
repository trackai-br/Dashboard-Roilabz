'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from 'lucide-react';

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

interface CampaignsTableNewProps {
  campaigns: Campaign[];
  loading?: boolean;
  error?: string;
}

const COLUMNS = [
  { key: 'name',       label: 'Campanha',   align: 'left'  as const, width: '26%' },
  { key: 'status',     label: 'Status',     align: 'left'  as const, width: '11%' },
  { key: 'spend',      label: 'Gasto',      align: 'right' as const, width: '11%' },
  { key: 'impressions',label: 'Impressões', align: 'right' as const, width: '11%' },
  { key: 'clicks',     label: 'Cliques',    align: 'right' as const, width: '10%' },
  { key: 'cpc',        label: 'CPC',        align: 'right' as const, width: '9%'  },
  { key: 'roas',       label: 'ROAS',       align: 'right' as const, width: '9%'  },
  { key: 'updated_at', label: 'Atualizado', align: 'left'  as const, width: '13%' },
];

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

const formatValue = (key: string, value: Campaign[keyof Campaign]): string => {
  if (value == null) return '—';
  switch (key) {
    case 'spend':
    case 'cpc':
      return `R$${parseFloat(String(value)).toFixed(2)}`;
    case 'roas':
      return `${parseFloat(String(value)).toFixed(2)}x`;
    case 'clicks':
    case 'impressions':
      return parseInt(String(value)).toLocaleString('pt-BR');
    case 'updated_at':
      return new Date(String(value)).toLocaleDateString('pt-BR');
    default:
      return String(value);
  }
};

const isNumericCol = (key: string) =>
  ['spend', 'impressions', 'clicks', 'cpc', 'roas'].includes(key);

export function CampaignsTableNew({ campaigns, loading }: CampaignsTableNewProps) {
  const [sortBy, setSortBy]       = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const aVal = a[sortBy as keyof Campaign] ?? '';
      const bVal = b[sortBy as keyof Campaign] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'pt-BR');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [campaigns, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortBy !== colKey) return <ChevronsUpDown size={11} aria-hidden="true" style={{ color: 'var(--color-text-tertiary)' }} />;
    return sortOrder === 'asc'
      ? <ChevronUp   size={11} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />
      : <ChevronDown size={11} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />;
  };

  if (loading) {
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)', overflow: 'hidden' }}>
        <div className="p-4 space-y-2.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bg-input)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto"
      style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-sidebar)' }}>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-4 cursor-pointer select-none text-${col.align}`}
                style={{ width: col.width, minWidth: col.width, height: '36px', verticalAlign: 'middle' }}
              >
                <span className="col-header flex items-center gap-1 hover:text-white transition-colors" style={{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                  {col.label}
                  <SortIcon colKey={col.key} />
                </span>
              </th>
            ))}
            <th className="px-4 text-center col-header" style={{ width: '48px', height: '36px', verticalAlign: 'middle' }}>
              —
            </th>
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Nenhuma campanha encontrada
              </td>
            </tr>
          ) : (
            sorted.map((campaign) => (
              <tr
                key={campaign.id}
                className="group transition-colors"
                style={{ borderBottom: '1px solid var(--color-border)', height: '44px' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-row-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 text-${col.align} whitespace-nowrap`}
                    style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}
                  >
                    {col.key === 'status' ? (
                      <span className={statusBadge[campaign.status] || 'badge-off'}>
                        {statusLabel[campaign.status] || campaign.status}
                      </span>
                    ) : col.key === 'name' ? (
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {campaign.name}
                      </span>
                    ) : isNumericCol(col.key) ? (
                      <span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>
                        {formatValue(col.key, campaign[col.key as keyof Campaign])}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {formatValue(col.key, campaign[col.key as keyof Campaign])}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-4 text-center">
                  <button
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
                    style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                    aria-label={`Ações para ${campaign.name}`}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
