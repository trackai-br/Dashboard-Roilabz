import React, { useMemo, useState } from 'react';

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
    if (!sortColumn || campaigns.length === 0) {
      return campaigns;
    }

    const sorted = [...campaigns].sort((a, b) => {
      const aVal = a[sortColumn as keyof Campaign];
      const bVal = b[sortColumn as keyof Campaign];

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [campaigns, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }

    if (onSort && column) {
      onSort(column, sortDirection === 'asc' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <span className="text-gray-400">⇅</span>;
    }
    return (
      <span className="text-blue-600 dark:text-blue-400">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const TableHeader = ({ label, column }: { label: string; column: SortColumn }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {label}
      <SortIcon column={column} />
    </button>
  );

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          Error loading campaigns: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accountSelector && <div className="flex items-center gap-4">{accountSelector}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <TableHeader label="Account" column={null} />
              </th>
              <th className="px-6 py-3 text-left">
                <TableHeader label="Name" column="name" />
              </th>
              <th className="px-6 py-3 text-left">
                <TableHeader label="Status" column="status" />
              </th>
              <th className="px-6 py-3 text-right">
                <TableHeader label="Spend" column="spend" />
              </th>
              <th className="px-6 py-3 text-right">
                <TableHeader label="Impressions" column="impressions" />
              </th>
              <th className="px-6 py-3 text-right">
                <TableHeader label="Clicks" column="clicks" />
              </th>
              <th className="px-6 py-3 text-right">
                <TableHeader label="CPC" column="cpc" />
              </th>
              <th className="px-6 py-3 text-right">
                <TableHeader label="ROAS" column="roas" />
              </th>
              <th className="px-6 py-3 text-left">Last Modified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="bg-white dark:bg-gray-800">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No campaigns found
                </td>
              </tr>
            ) : (
              sortedCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    {campaign.account_name || campaign.account_id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        campaign.status === 'ACTIVE'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : campaign.status === 'PAUSED'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    ${campaign.spend.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    {campaign.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    {campaign.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    ${campaign.cpc.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    {campaign.roas.toFixed(2)}x
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {new Date(campaign.updated_at).toLocaleDateString()}
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
