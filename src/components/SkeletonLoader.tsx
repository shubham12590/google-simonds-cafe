import React from 'react';

interface SkeletonLoaderProps {
  type?: 'chart' | 'table' | 'card' | 'text';
  rows?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'text', rows = 3, className = '' }) => {
  const baseClass = "animate-pulse bg-slate-200 rounded-lg";

  if (type === 'chart') {
    return (
      <div className={`w-full h-64 ${baseClass} ${className} flex items-end justify-around p-4 gap-2`}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-full bg-slate-300 rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`w-full ${className}`}>
        <div className={`h-10 mb-4 ${baseClass} w-full`} />
        {[...Array(rows)].map((_, i) => (
          <div key={i} className={`h-12 mb-2 ${baseClass} w-full`} />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`p-4 sm:p-6 ${baseClass} ${className}`}>
        <div className="h-4 bg-slate-300 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-300 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-300 rounded w-1/4" />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`h-4 ${baseClass} ${i === rows - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
};
