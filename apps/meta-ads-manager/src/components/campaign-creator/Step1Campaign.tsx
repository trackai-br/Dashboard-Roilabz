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
}

const CAMPAIGN_OBJECTIVES = [
  'OUTCOME_SALES',
  'OUTCOME_LEADS',
  'OUTCOME_TRAFFIC',
  'OUTCOME_APP_INSTALLS',
  'OUTCOME_ENGAGEMENT',
  'OUTCOME_IMPRESSIONS',
];

export function Step1Campaign({ data, onChange }: Step1CampaignProps) {

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
          Campaign Name *
        </label>
        <input
          type="text"
          value={data.campaignName}
          onChange={(e) => onChange('campaignName', e.target.value)}
          placeholder="e.g., Summer Sale Campaign"
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
          Campaign Objective *
        </label>
        <select
          value={data.campaignObjective}
          onChange={(e) => onChange('campaignObjective', e.target.value)}
          className="input w-full"
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
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Active</span>
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
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Paused</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Daily Budget</span>
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
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Lifetime Budget</span>
          </label>
        </div>
      </div>

      {data.budgetType === 'daily' && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
            className="input w-full"
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
            Minimum: $5.00 per day
          </p>
        </div>
      )}

      {data.budgetType === 'lifetime' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={data.campaignStartTime?.split('T')[0] || ''}
                onChange={(e) => onChange('campaignStartTime', e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                End Date
              </label>
              <input
                type="date"
                value={data.campaignStopTime?.split('T')[0] || ''}
                onChange={(e) => onChange('campaignStopTime', e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        </>
      )}

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-info)' }}>
          💡 <strong>Tip:</strong> Campaign Budget Optimization (CBO) is automatically applied.
          You can adjust daily or ad set budgets in the next step.
        </p>
      </div>
    </div>
  );
}
