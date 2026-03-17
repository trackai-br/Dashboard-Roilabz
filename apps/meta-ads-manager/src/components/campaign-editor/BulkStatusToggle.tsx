import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkStatusToggleProps {
  selectedIds: string[];
  onClear: () => void;
  darkMode?: boolean;
}

export function BulkStatusToggle({
  selectedIds,
  onClear,
  darkMode = false,
}: BulkStatusToggleProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async (status: 'ACTIVE' | 'PAUSED') => {
    setLoading(true);
    setError(null);

    try {
      // Update each campaign
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/meta/campaigns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          }).then((res) => {
            if (!res.ok) throw new Error('Failed to update');
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onClear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        darkMode
          ? 'border-gray-700 bg-gray-800'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {selectedIds.length} campaign{selectedIds.length !== 1 ? 's' : ''} selected
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleToggleStatus('ACTIVE')}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            ✓ Activate
          </button>
          <button
            onClick={() => handleToggleStatus('PAUSED')}
            disabled={loading}
            className="rounded-lg bg-yellow-600 px-4 py-2 font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            ⏸ Pause
          </button>
          <button
            onClick={onClear}
            disabled={loading}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
