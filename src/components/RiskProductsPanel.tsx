import React from 'react';
import { ProductGrowthStats } from '../utils/comparisonUtils';
import { AlertTriangle, ArrowDownRight } from 'lucide-react';

interface RiskProductsPanelProps {
  data: ProductGrowthStats[];
}

export const RiskProductsPanel: React.FC<RiskProductsPanelProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-red-500" size={20} />
        <h3 className="text-lg font-semibold text-slate-800">Risk Alerts</h3>
      </div>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No significant risks detected.</p>
        ) : (
          data.slice(0, 5).map((p) => (
            <div key={p.productName} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div>
                <p className="text-sm font-medium text-slate-800">{p.productName}</p>
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <ArrowDownRight size={12} />
                  {Math.abs(p.revenueGrowth).toFixed(1)}% Revenue Drop
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Lost Revenue</p>
                <p className="text-sm font-bold text-red-700">-₹{Math.abs(p.revenueDiff).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
