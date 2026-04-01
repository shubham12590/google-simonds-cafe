import React from 'react';
import { PeriodStats } from '../utils/comparisonUtils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface ExecutiveKpisProps {
  statsA: PeriodStats;
  statsB: PeriodStats;
}

const KpiCard: React.FC<{ label: string; valueA: number; valueB: number; format?: 'currency' | 'number' | 'percent' }> = ({ label, valueA, valueB, format = 'number' }) => {
  const diff = valueA - valueB;
  const growth = valueB === 0 ? (valueA === 0 ? 0 : 100) : ((diff) / valueB) * 100;
  const isPositive = growth >= 0;
  
  const formatValue = (val: number) => {
    if (format === 'currency') return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (format === 'percent') return `${val.toFixed(1)}%`;
    return val.toLocaleString('en-IN');
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1 sm:mb-2 truncate">{label}</p>
      <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-3">
        <span className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{formatValue(valueA)}</span>
        <div className={`flex items-center text-xs sm:text-sm font-medium sm:mb-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight size={14} className="sm:w-4 sm:h-4" /> : <ArrowDownRight size={14} className="sm:w-4 sm:h-4" />}
          {Math.abs(growth).toFixed(1)}%
        </div>
      </div>
      <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2 truncate">Prev: {formatValue(valueB)}</p>
    </div>
  );
};

export const ExecutiveKpis: React.FC<ExecutiveKpisProps> = ({ statsA, statsB }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Revenue" valueA={statsA.revenue} valueB={statsB.revenue} format="currency" />
      <KpiCard label="Quantity" valueA={statsA.quantity} valueB={statsB.quantity} />
      <KpiCard label="Orders (Est.)" valueA={statsA.orders} valueB={statsB.orders} />
      <KpiCard label="Avg Order Value" valueA={statsA.aov} valueB={statsB.aov} format="currency" />
    </div>
  );
};
