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
}

const BILLING_EVENTS = ['IMPRESSIONS', 'LINK_CLICKS', 'POST_ENGAGEMENT'];
const BID_STRATEGIES = [
  'LOWEST_COST_WITHOUT_CAP',
  'LOWEST_COST_WITH_BID_CAP',
  'COST_CAP',
];

export function Step2AdSet({ data, onChange }: Step2AdSetProps) {

  const handleTargetingChange = (key: string, value: any) => {
    onChange('adSetTargeting', {
      ...data.adSetTargeting,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
          Ad Set Name *
        </label>
        <input
          type="text"
          value={data.adSetName}
          onChange={(e) => onChange('adSetName', e.target.value)}
          placeholder="e.g., Summer Sale - Interests"
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Active</span>
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
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Paused</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
          className="input w-full"
        />
        <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
          Leave empty to use campaign daily budget
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
          Billing Event *
        </label>
        <select
          value={data.adSetBillingEvent}
          onChange={(e) => onChange('adSetBillingEvent', e.target.value)}
          className="input w-full"
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
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
          Bid Strategy *
        </label>
        <select
          value={data.adSetBidStrategy}
          onChange={(e) => onChange('adSetBidStrategy', e.target.value)}
          className="input w-full"
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
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
            className="input w-full"
          />
        </div>
      )}

      {data.adSetBidStrategy === 'COST_CAP' && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
            className="input w-full"
          />
        </div>
      )}

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-info)' }}>
          💡 <strong>Placements:</strong> Advantage+ (automatic placements) will be used
          across Meta platforms.
        </p>
      </div>

      {/* Targeting Section */}
      <div className="pt-6" style={{ borderTop: '1px solid var(--color-tertiary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          Targeting
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Age Range
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={data.adSetTargeting?.age_min || '18'}
                onChange={(e) => handleTargetingChange('age_min', Number(e.target.value))}
                className="input rounded-lg px-3 py-2"
              >
                {[18, 21, 25, 30, 35, 40, 45, 50, 55, 60, 65].map((age) => (
                  <option key={age} value={age}>
                    {age}+
                  </option>
                ))}
              </select>
              <span style={{ color: 'var(--color-primary)' }}>to</span>
              <select
                value={data.adSetTargeting?.age_max || '65'}
                onChange={(e) => handleTargetingChange('age_max', Number(e.target.value))}
                className="input rounded-lg px-3 py-2"
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
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
                  <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
                    {gender.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
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
                  <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
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
