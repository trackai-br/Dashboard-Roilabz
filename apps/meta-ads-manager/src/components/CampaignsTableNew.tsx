'use client';

import React, { useState, useMemo } from 'react';

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

export function CampaignsTableNew({ campaigns, loading }: CampaignsTableNewProps) {
  const [sortBy, setSortBy] = useState<string>('campaign_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const columns = [
    { key: 'name', label: 'Campanha', width: '25%' },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'spend', label: 'Gasto', width: '12%' },
    { key: 'impressions', label: 'Impressões', width: '12%' },
    { key: 'clicks', label: 'Cliques', width: '12%' },
    { key: 'cpc', label: 'CPC', width: '10%' },
    { key: 'roas', label: 'ROAS', width: '10%' },
    { key: 'updated_at', label: 'Atualizado', width: '15%' },
  ];

  const sortedCampaigns = useMemo(() => {
    const sorted = [...campaigns].sort((a, b) => {
      const aVal = a[sortBy as keyof Campaign] ?? '';
      const bVal = b[sortBy as keyof Campaign] ?? '';

      // Handle non-string, non-number types (arrays, etc)
      if (typeof aVal !== 'string' && typeof aVal !== 'number') {
        return 0;
      }
      if (typeof bVal !== 'string' && typeof bVal !== 'number') {
        return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const numA = parseFloat(String(aVal)) || 0;
      const numB = parseFloat(String(bVal)) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
    return sorted;
  }, [campaigns, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'var(--color-success)', backgroundColor: 'var(--color-success-bg)' };
      case 'PAUSED':
        return { color: 'var(--color-warning)', backgroundColor: 'var(--color-warning-bg)' };
      case 'ARCHIVED':
        return { color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)' };
      default:
        return { color: 'var(--color-secondary)', backgroundColor: 'var(--bg-input)' };
    }
  };

  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (key) {
      case 'spend':
      case 'cpc':
        return `$${parseFloat(String(value)).toFixed(2)}`;
      case 'roas':
        return parseFloat(String(value)).toFixed(2) + 'x';
      case 'clicks':
      case 'impressions':
        return parseInt(String(value)).toLocaleString('pt-BR');
      case 'updated_at':
        return new Date(String(value)).toLocaleDateString('pt-BR');
      default:
        return String(value);
    }
  };

  if (loading) {
    return (
      <div className="rounded-card border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
        <div className="space-y-3 p-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-input)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border overflow-hidden overflow-x-auto" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottomColor: 'var(--color-tertiary)', borderBottomWidth: '1px' }}>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => {
                  setSortBy(col.key);
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="px-6 py-4 text-left text-sm font-semibold cursor-pointer transition-colors uppercase"
                style={{ width: col.width, minWidth: col.width, color: 'var(--color-secondary)' }}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortBy === col.key && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
            <th className="px-6 py-4 text-center text-sm font-semibold w-12 uppercase" style={{ color: 'var(--color-secondary)' }}>
              Ação
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCampaigns.map((campaign, idx) => (
            <tr
              key={campaign.id}
              className="transition-colors group"
              style={{
                backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-table-alt)',
                borderBottomColor: 'var(--color-tertiary)',
                borderBottomWidth: '1px'
              }}
            >
              {columns.map(col => (
                <td key={`${campaign.id}-${col.key}`} className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: 'var(--color-primary)' }}>
                  {col.key === 'status' ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </span>
                  ) : col.key === 'spend' || col.key === 'cpc' ? (
                    <span className="font-medium font-mono" style={{ color: 'var(--color-brand)' }}>
                      {formatValue(col.key, campaign[col.key as keyof Campaign])}
                    </span>
                  ) : col.key === 'roas' ? (
                    <span className="font-medium font-mono" style={{ color: 'var(--color-success)' }}>
                      {formatValue(col.key, campaign[col.key as keyof Campaign])}
                    </span>
                  ) : (
                    formatValue(col.key, campaign[col.key as keyof Campaign])
                  )}
                </td>
              ))}
              <td className="px-6 py-4 text-center">
                <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--color-secondary)' }}>
                  ⋯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedCampaigns.length === 0 && (
        <div className="px-6 py-12 text-center" style={{ color: 'var(--color-secondary)' }}>
          <p>Nenhuma campanha encontrada</p>
        </div>
      )}
    </div>
  );
}
