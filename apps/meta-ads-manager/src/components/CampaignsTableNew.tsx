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
        return 'text-growth-400 bg-growth-500/10';
      case 'PAUSED':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'ARCHIVED':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
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
      <div className="rounded-xl border border-dark-700/50 overflow-hidden bg-dark-900/50">
        <div className="space-y-3 p-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-dark-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dark-700/50 overflow-hidden bg-dark-900/50 backdrop-blur-sm overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-700/50 bg-dark-800/50">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => {
                  setSortBy(col.key);
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-energy-400 transition-colors"
                style={{ width: col.width, minWidth: col.width }}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortBy === col.key && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 w-12">
              Ação
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCampaigns.map((campaign) => (
            <tr
              key={campaign.id}
              className="border-b border-dark-700/30 hover:bg-dark-800/50 transition-colors group"
            >
              {columns.map(col => (
                <td key={`${campaign.id}-${col.key}`} className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                  {col.key === 'status' ? (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  ) : col.key === 'spend' || col.key === 'cpc' ? (
                    <span className="text-energy-400 font-medium">{formatValue(col.key, campaign[col.key as keyof Campaign])}</span>
                  ) : col.key === 'roas' ? (
                    <span className="text-growth-400 font-medium">{formatValue(col.key, campaign[col.key as keyof Campaign])}</span>
                  ) : (
                    formatValue(col.key, campaign[col.key as keyof Campaign])
                  )}
                </td>
              ))}
              <td className="px-6 py-4 text-center">
                <button className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-gray-400 hover:text-energy-400">
                  ⋯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedCampaigns.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-400">Nenhuma campanha encontrada</p>
        </div>
      )}
    </div>
  );
}
