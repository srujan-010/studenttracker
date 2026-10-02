import React from 'react';

export function LoadingSkeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded border border-slate-200"></div>
        ))}
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-white border border-slate-200 rounded-lg p-5">
          <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}
