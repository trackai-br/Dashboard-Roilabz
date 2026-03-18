import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkStatusToggleProps {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkStatusToggle({
  selectedIds,
  onClear,
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
      className="rounded-lg border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
            {selectedIds.length} campaign{selectedIds.length !== 1 ? 's' : ''} selected
          </p>
          {error && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleToggleStatus('ACTIVE')}
            disabled={loading}
            className="rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            ✓ Activate
          </button>
          <button
            onClick={() => handleToggleStatus('PAUSED')}
            disabled={loading}
            className="rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-warning)' }}
          >
            ⏸ Pause
          </button>
          <button
            onClick={onClear}
            disabled={loading}
            className="rounded-lg border px-4 py-2 font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
