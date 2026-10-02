import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'risk' | 'status' | 'priority' | 'role' | 'neutral';
  value?: string;
  className?: string;
}

export function Badge({ children, variant = 'neutral', value, className = '' }: BadgeProps) {
  const text = (value || children?.toString() || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'risk' || text === 'HIGH' || text === 'MEDIUM' || text === 'LOW') {
    if (text === 'HIGH' || text === 'HIGH RISK') {
      colorClasses = 'bg-red-50 text-red-700 border-red-200 font-semibold';
    } else if (text === 'MEDIUM' || text === 'MEDIUM RISK') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
    } else {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
    }
  } else if (variant === 'status') {
    if (text === 'OPEN') {
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (text === 'IN_PROGRESS') {
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
    } else if (text === 'COMPLETED') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (text === 'CANCELLED') {
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
    }
  } else if (variant === 'priority') {
    if (text === 'URGENT') {
      colorClasses = 'bg-red-100 text-red-800 border-red-300 font-bold';
    } else if (text === 'HIGH') {
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
    } else if (text === 'MEDIUM') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (variant === 'role') {
    if (text === 'ADMIN') {
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
    } else if (text === 'TEACHER') {
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
    } else {
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200 font-medium';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
}
