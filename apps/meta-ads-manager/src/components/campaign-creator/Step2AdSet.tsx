import React from 'react';

interface Step2AdSetProps {
  data: {
    adSetName: string;
    adSetStatus: 'ACTIVE' | 'PAUSED';
    adSetDailyBudget?: number;
    adSetLifetimeBudget?: number;
    adSetBillingEvent: string;
    adSetBidStrategy: string;
    adSetBidAmount?: number;
    adSetTargeting: Record<string, any>;
  };
  onChange: (field: string, value: any) => void;
  darkMode?: boolean;
}

const BILLING_EVENTS = ['IMPRESSIONS', 'LINK_CLICKS', 'POST_ENGAGEMENT'];
const BID_STRATEGIES = [
  'LOWEST_COST_WITHOUT_CAP',
  'LOWEST_COST_WITH_BID_CAP',
  'COST_CAP',
];

export function Step2AdSet({ data, onChange, darkMode = false }: Step2AdSetProps) {
  const inputClass = darkMode
    ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const handleTargetingChange = (key: string, value: any) => {
    onChange('adSetTargeting', {
      ...data.adSetTargeting,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ad Set Name *
        </label>
        <input
          type="text"
          value={data.adSetName}
          onChange={(e) => onChange('adSetName', e.target.value)}
          placeholder="e.g., Summer Sale - Interests"
          className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ad Set Status
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="adSetStatus"
              value="ACTIVE"
              checked={data.adSetStatus === 'ACTIVE'}
              onChange={(e) => onChange('adSetStatus', e.target.value)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="adSetStatus"
              value="PAUSED"
              checked={data.adSetStatus === 'PAUSED'}
              onChange={(e) => onChange('adSetStatus', e.target.value)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Paused</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Daily Budget (USD)
        </label>
        <input
          type="number"
          value={data.adSetDailyBudget || ''}
          onChange={(e) =>
            onChange(
              'adSetDailyBudget',
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          placeholder="e.g., 25.00"
          step="0.01"
          min="0"
          className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave empty to use campaign daily budget
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Billing Event *
        </label>
        <select
          value={data.adSetBillingEvent}
          onChange={(e) => onChange('adSetBillingEvent', e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
        >
          <option value="">Select billing event</option>
          {BILLING_EVENTS.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bid Strategy *
        </label>
        <select
          value={data.adSetBidStrategy}
          onChange={(e) => onChange('adSetBidStrategy', e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
        >
          <option value="">Select bid strategy</option>
          {BID_STRATEGIES.map((strategy) => (
            <option key={strategy} value={strategy}>
              {strategy}
            </option>
          ))}
        </select>
      </div>

      {data.adSetBidStrategy === 'LOWEST_COST_WITH_BID_CAP' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bid Cap (USD) *
          </label>
          <input
            type="number"
            value={data.adSetBidAmount || ''}
            onChange={(e) =>
              onChange(
                'adSetBidAmount',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="e.g., 2.50"
            step="0.01"
            min="0"
            className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
          />
        </div>
      )}

      {data.adSetBidStrategy === 'COST_CAP' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cost Cap (USD) *
          </label>
          <input
            type="number"
            value={data.adSetBidAmount || ''}
            onChange={(e) =>
              onChange(
                'adSetBidAmount',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder="e.g., 5.00"
            step="0.01"
            min="0"
            className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
          />
        </div>
      )}

      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Placements:</strong> Advantage+ (automatic placements) will be used
          across Meta platforms.
        </p>
      </div>

      {/* Targeting Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Targeting
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age Range
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={data.adSetTargeting?.age_min || '18'}
                onChange={(e) => handleTargetingChange('age_min', Number(e.target.value))}
                className={`rounded-lg border px-3 py-2 ${inputClass}`}
              >
                {[18, 21, 25, 30, 35, 40, 45, 50, 55, 60, 65].map((age) => (
                  <option key={age} value={age}>
                    {age}+
                  </option>
                ))}
              </select>
              <span className="text-gray-700 dark:text-gray-300">to</span>
              <select
                value={data.adSetTargeting?.age_max || '65'}
                onChange={(e) => handleTargetingChange('age_max', Number(e.target.value))}
                className={`rounded-lg border px-3 py-2 ${inputClass}`}
              >
                {[25, 30, 35, 40, 45, 50, 55, 60, 65].map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genders
            </label>
            <div className="flex gap-4">
              {[
                { value: 1, label: 'Men' },
                { value: 2, label: 'Women' },
                { value: 0, label: 'All' },
              ].map((gender) => (
                <label key={gender.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      Array.isArray(data.adSetTargeting?.genders)
                        ? data.adSetTargeting.genders.includes(gender.value)
                        : false
                    }
                    onChange={(e) => {
                      const current = data.adSetTargeting?.genders || [];
                      if (e.target.checked) {
                        handleTargetingChange('genders', [...current, gender.value]);
                      } else {
                        handleTargetingChange(
                          'genders',
                          current.filter((g: number) => g !== gender.value)
                        );
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {gender.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Countries (comma-separated, e.g., BR,US)
            </label>
            <input
              type="text"
              value={
                Array.isArray(data.adSetTargeting?.geo_locations)
                  ? data.adSetTargeting.geo_locations.join(',')
                  : ''
              }
              onChange={(e) =>
                handleTargetingChange(
                  'geo_locations',
                  e.target.value.split(',').map((c) => c.trim())
                )
              }
              placeholder="BR,US,MX"
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device Types
            </label>
            <div className="space-y-2">
              {['mobile', 'desktop', 'tablet'].map((device) => (
                <label key={device} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      Array.isArray(data.adSetTargeting?.device_platforms)
                        ? data.adSetTargeting.device_platforms.includes(device)
                        : false
                    }
                    onChange={(e) => {
                      const current = data.adSetTargeting?.device_platforms || [];
                      if (e.target.checked) {
                        handleTargetingChange('device_platforms', [...current, device]);
                      } else {
                        handleTargetingChange(
                          'device_platforms',
                          current.filter((d: string) => d !== device)
                        );
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {device.charAt(0).toUpperCase() + device.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
