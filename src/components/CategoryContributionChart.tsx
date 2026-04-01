import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CategoryGrowthStats } from '../utils/comparisonUtils';

interface CategoryContributionChartProps {
  data: CategoryGrowthStats[];
}

export const CategoryContributionChart: React.FC<CategoryContributionChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
    name: d.category,
    'Period A': d.contributionA,
    'Period B': d.contributionB,
  })).sort((a, b) => b['Period A'] - a['Period A']);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Category Contribution Shift</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(val) => `${val}%`} width={40} />
            <Tooltip 
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Contribution']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Period A" fill="#F97316" radius={[4, 4, 0, 0]} name="Current Period" />
            <Bar dataKey="Period B" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Previous Period" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
