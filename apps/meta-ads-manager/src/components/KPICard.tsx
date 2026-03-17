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
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow${className ? ` ${className}` : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <>
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {value}
                </span>
                {unit && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {unit}
                  </span>
                )}
              </>
            )}
          </div>
          {trend !== undefined && !loading && (
            <p
              className={`mt-2 text-sm font-medium ${
                trend >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend >= 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        {icon && !loading && (
          <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
