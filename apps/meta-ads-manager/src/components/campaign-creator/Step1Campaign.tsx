import React from 'react';

interface Step1CampaignProps {
  data: {
    campaignName: string;
    campaignObjective: string;
    campaignStatus: 'ACTIVE' | 'PAUSED';
    campaignStartTime?: string;
    campaignStopTime?: string;
    campaignDailyBudget?: number;
    campaignLifetimeBudget?: number;
    budgetType: 'daily' | 'lifetime';
  };
  onChange: (field: string, value: any) => void;
  darkMode?: boolean;
}

const CAMPAIGN_OBJECTIVES = [
  'OUTCOME_SALES',
  'OUTCOME_LEADS',
  'OUTCOME_TRAFFIC',
  'OUTCOME_APP_INSTALLS',
  'OUTCOME_ENGAGEMENT',
  'OUTCOME_IMPRESSIONS',
];

export function Step1Campaign({ data, onChange, darkMode = false }: Step1CampaignProps) {
  const inputClass = darkMode
    ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-white'
    : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          value={data.campaignName}
          onChange={(e) => onChange('campaignName', e.target.value)}
          placeholder="e.g., Summer Sale Campaign"
          className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Campaign Objective *
        </label>
        <select
          value={data.campaignObjective}
          onChange={(e) => onChange('campaignObjective', e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
        >
          <option value="">Select an objective</option>
          {CAMPAIGN_OBJECTIVES.map((obj) => (
            <option key={obj} value={obj}>
              {obj}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Campaign Status
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="ACTIVE"
              checked={data.campaignStatus === 'ACTIVE'}
              onChange={(e) => onChange('campaignStatus', e.target.value)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="PAUSED"
              checked={data.campaignStatus === 'PAUSED'}
              onChange={(e) => onChange('campaignStatus', e.target.value)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Paused</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Budget Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="budgetType"
              value="daily"
              checked={data.budgetType === 'daily'}
              onChange={(e) => onChange('budgetType', e.target.value)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Daily Budget</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="budgetType"
              value="lifetime"
              checked={data.budgetType === 'lifetime'}
              onChange={(e) => onChange('budgetType', e.target.value)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Lifetime Budget</span>
          </label>
        </div>
      </div>

      {data.budgetType === 'daily' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Daily Budget (USD) *
          </label>
          <input
            type="number"
            value={data.campaignDailyBudget || ''}
            onChange={(e) =>
              onChange('campaignDailyBudget', e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="e.g., 50.00"
            step="0.01"
            min="0"
            className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum: $5.00 per day
          </p>
        </div>
      )}

      {data.budgetType === 'lifetime' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Budget (USD) *
            </label>
            <input
              type="number"
              value={data.campaignLifetimeBudget || ''}
              onChange={(e) =>
                onChange(
                  'campaignLifetimeBudget',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="e.g., 500.00"
              step="0.01"
              min="0"
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={data.campaignStartTime?.split('T')[0] || ''}
                onChange={(e) => onChange('campaignStartTime', e.target.value)}
                className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={data.campaignStopTime?.split('T')[0] || ''}
                onChange={(e) => onChange('campaignStopTime', e.target.value)}
                className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
              />
            </div>
          </div>
        </>
      )}

      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Tip:</strong> Campaign Budget Optimization (CBO) is automatically applied.
          You can adjust daily or ad set budgets in the next step.
        </p>
      </div>
    </div>
  );
}
