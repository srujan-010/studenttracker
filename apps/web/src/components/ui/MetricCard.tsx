import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'blue' | 'red' | 'amber' | 'emerald' | 'purple' | 'slate';
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'blue',
  onClick,
}: MetricCardProps) {
  const borderAccents = {
    blue: 'border-l-4 border-l-blue-600',
    red: 'border-l-4 border-l-red-500',
    amber: 'border-l-4 border-l-amber-500',
    emerald: 'border-l-4 border-l-emerald-500',
    purple: 'border-l-4 border-l-purple-600',
    slate: 'border-l-4 border-l-slate-400',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow ${borderAccents[accentColor]} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {icon && (
          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 border border-slate-100">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
