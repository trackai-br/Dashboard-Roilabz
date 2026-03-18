import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EditCampaignDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    campaign_id: string;
    campaign_name: string;
    status: string;
    daily_budget_micros?: number;
    budget_amount_micros?: number;
    start_time?: string;
    end_time?: string;
  };
  darkMode?: boolean;
}

export function EditCampaignDrawer({
  isOpen,
  onClose,
  campaign,
  darkMode = false,
}: EditCampaignDrawerProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    status: campaign.status,
    daily_budget_micros: campaign.daily_budget_micros,
    start_time: campaign.start_time?.split('T')[0],
    end_time: campaign.end_time?.split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/meta/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-96 shadow-lg overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-brand)' }}>
              Edit Campaign
            </h2>
            <button
              onClick={onClose}
              style={{ color: 'var(--color-secondary)' }}
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border p-3" style={{ backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)' }}>
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="input w-full"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                Daily Budget (USD)
              </label>
              <input
                type="number"
                value={formData.daily_budget_micros || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    daily_budget_micros: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="e.g., 50.00"
                step="0.01"
                min="0"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_time || ''}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                End Date
              </label>
              <input
                type="date"
                value={formData.end_time || ''}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="input w-full"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 font-medium transition-colors"
              style={{ borderColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
