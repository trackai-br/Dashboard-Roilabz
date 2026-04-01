import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: number;
  loading?: boolean;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  loading = false,
  className,
}) => {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={`p-4 transition-all${className ? ` ${className}` : ''}`}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-accent)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="col-header mb-2">{title}</p>

          {/* Value */}
          {loading ? (
            <div className="h-7 w-24 animate-pulse rounded" style={{ backgroundColor: 'var(--color-bg-input)' }} />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span
                className="value-mono"
                style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}
              >
                {value}
              </span>
              {unit && (
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {unit}
                </span>
              )}
            </div>
          )}

          {/* Trend */}
          {trend !== undefined && !loading && (
            <div className="flex items-center gap-1 mt-2">
              {trendPositive
                ? <TrendingUp size={12} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                : <TrendingDown size={12} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
              }
              <span
                className="text-xs font-medium"
                style={{ color: trendPositive ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {trendPositive ? '+' : ''}{trend}% mês anterior
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && !loading && (
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
