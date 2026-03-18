import React from 'react';

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
  return (
    <div
      className={`card p-6 transition-shadow hover:shadow-card-hover${className ? ` ${className}` : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-input)' }} />
            ) : (
              <>
                <span className="text-2xl font-semibold font-mono" style={{ color: 'var(--color-primary)' }}>
                  {value}
                </span>
                {unit && (
                  <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {unit}
                  </span>
                )}
              </>
            )}
          </div>
          {trend !== undefined && !loading && (
            <p
              className="mt-2 text-sm font-medium"
              style={{ color: trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
            >
              {trend >= 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        {icon && !loading && (
          <div
            className="ml-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--bg-input)' }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
