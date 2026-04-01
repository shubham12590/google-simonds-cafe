
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AggregatedProductData } from '../utils/prediction';
import { format, parseISO } from 'date-fns';

interface WeeklyPatternChartProps {
  data: AggregatedProductData[];
  targetWeekday: number; // 0-6
  maxDates?: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

export const WeeklyPatternChart: React.FC<WeeklyPatternChartProps> = ({ 
  data, 
  targetWeekday,
  maxDates = 8 
}) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Collect all unique dates from the top products
    const allDates = new Set<string>();
    data.forEach(product => {
      // Take last N dates
      const dates = product.dates.slice(-maxDates);
      dates.forEach(d => allDates.add(d));
    });

    const sortedDates = Array.from(allDates).sort();

    // Transform to Recharts format
    return sortedDates.map(date => {
      const point: any = { date };
      data.forEach(product => {
        const idx = product.dates.indexOf(date);
        if (idx !== -1) {
          point[product.productName] = product.dailyQuantities[idx];
        }
      });
      return point;
    });
  }, [data, maxDates]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-400">No historical data for this weekday pattern</p>
      </div>
    );
  }

  const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetWeekday];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Historical Pattern ({weekdayName}s)
        <span className="text-sm font-normal text-slate-500 ml-2">Last {chartData.length} matching days</span>
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => format(parseISO(str), 'MMM d')}
              stroke="#94a3b8"
              fontSize={10}
            />
            <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val} width={40} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(label) => format(parseISO(label as string), 'EEE, MMM d, yyyy')}
            />
            <Legend />
            {data.slice(0, 5).map((product, index) => (
              <Line
                key={product.productName}
                type="monotone"
                dataKey={product.productName}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
