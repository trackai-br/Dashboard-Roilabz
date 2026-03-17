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

  const inputClass = darkMode
    ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-white'
    : 'bg-white border-gray-300 text-gray-900';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-lg overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Campaign
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_time || ''}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_time || ''}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
