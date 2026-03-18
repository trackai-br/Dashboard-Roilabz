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
        return {
          color: 'var(--color-success)',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          boxShadow: '0 0 8px rgba(0, 255, 136, 0.2)',
        };
      case 'PAUSED':
        return {
          color: 'var(--color-warning)',
          backgroundColor: 'rgba(255, 183, 3, 0.1)',
          border: '1px solid rgba(255, 183, 3, 0.3)',
          boxShadow: '0 0 8px rgba(255, 183, 3, 0.2)',
        };
      case 'ARCHIVED':
        return {
          color: 'var(--color-danger)',
          backgroundColor: 'rgba(255, 51, 51, 0.1)',
          border: '1px solid rgba(255, 51, 51, 0.3)',
          boxShadow: '0 0 8px rgba(255, 51, 51, 0.2)',
        };
      default:
        return {
          color: 'var(--color-secondary)',
          backgroundColor: 'rgba(57, 255, 20, 0.08)',
          border: '1px solid rgba(57, 255, 20, 0.2)',
        };
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
    <div
      className="rounded-lg border overflow-hidden overflow-x-auto backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(26, 26, 46, 0.7)',
        border: 'var(--border-light)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr
            style={{
              backgroundColor: 'rgba(22, 33, 62, 0.8)',
              borderBottom: 'var(--border-default)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => {
                  setSortBy(col.key);
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="px-6 py-3.5 text-left text-xs font-bold cursor-pointer transition-colors"
                style={{
                  width: col.width,
                  minWidth: col.width,
                  color: 'var(--neon-green)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  textShadow: '0 0 6px rgba(57, 255, 20, 0.2)',
                }}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortBy === col.key && (
                    <span className="text-xs opacity-70">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
            <th
              className="px-6 py-3.5 text-center text-xs font-bold w-12"
              style={{
                color: 'var(--neon-green)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
              }}
            >
              AÇÃO
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {sortedCampaigns.map((campaign, idx) => (
            <tr
              key={campaign.id}
              className="group transition-all duration-150"
              style={{
                backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(20, 20, 41, 0.5)',
                borderBottom: 'var(--border-light)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  idx % 2 === 0 ? 'transparent' : 'rgba(20, 20, 41, 0.5)';
              }}
            >
              {columns.map((col) => (
                <td
                  key={`${campaign.id}-${col.key}`}
                  className="px-6 py-3 text-sm whitespace-nowrap"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {col.key === 'status' ? (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        ...getStatusColor(campaign.status),
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {campaign.status}
                    </span>
                  ) : col.key === 'spend' || col.key === 'cpc' ? (
                    <span
                      className="font-mono font-medium"
                      style={{
                        color: 'var(--neon-green)',
                        textShadow: '0 0 6px rgba(57, 255, 20, 0.25)',
                      }}
                    >
                      {formatValue(col.key, campaign[col.key as keyof Campaign])}
                    </span>
                  ) : col.key === 'roas' ? (
                    <span
                      className="font-mono font-medium"
                      style={{
                        color: 'var(--color-success)',
                        textShadow: '0 0 6px rgba(0, 255, 136, 0.25)',
                      }}
                    >
                      {formatValue(col.key, campaign[col.key as keyof Campaign])}
                    </span>
                  ) : col.key === 'name' ? (
                    <span
                      className="font-medium"
                      style={{
                        color: 'var(--neon-green)',
                        textShadow: '0 0 6px rgba(57, 255, 20, 0.2)',
                      }}
                    >
                      {formatValue(col.key, campaign[col.key as keyof Campaign])}
                    </span>
                  ) : (
                    formatValue(col.key, campaign[col.key as keyof Campaign])
                  )}
                </td>
              ))}
              <td className="px-6 py-3 text-center">
                <button
                  className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  style={{
                    color: 'var(--neon-green)',
                    backgroundColor: 'rgba(57, 255, 20, 0.08)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(57, 255, 20, 0.3)';
                    e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.08)';
                  }}
                >
                  ⋯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedCampaigns.length === 0 && (
        <div
          className="px-6 py-16 text-center"
          style={{ color: 'var(--color-secondary)' }}
        >
          <p className="text-sm">Nenhuma campanha encontrada</p>
        </div>
      )}
    </div>
  );
}
