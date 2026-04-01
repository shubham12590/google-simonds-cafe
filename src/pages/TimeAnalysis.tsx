import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TIME_SLOT_COLORS = {
  Morning: '#FCD34D', // yellow-300
  Afternoon: '#F97316', // orange-500
  Evening: '#3B82F6', // blue-500
};

export const TimeAnalysis: React.FC = () => {
  const { filteredData } = useData();

  const revenueByTimeSlot = useMemo(() => {
    const slotMap = new Map<string, number>([
      ['Morning', 0],
      ['Afternoon', 0],
      ['Evening', 0],
    ]);

    filteredData.forEach((record) => {
      slotMap.set(record.timeSlot, (slotMap.get(record.timeSlot) || 0) + record.totalAmount);
    });

    return Array.from(slotMap.entries()).map(([timeSlot, revenue]) => ({
      timeSlot,
      revenue,
    }));
  }, [filteredData]);

  const hourlyQuantity = useMemo(() => {
    const hourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) hourMap.set(i, 0);

    filteredData.forEach((record) => {
      hourMap.set(record.hour, (hourMap.get(record.hour) || 0) + record.quantity);
    });

    return Array.from(hourMap.entries())
      .map(([hour, quantity]) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        quantity,
      }))
      .filter((item) => item.quantity > 0);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue by Time Slot */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue by Time Slot</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByTimeSlot} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="timeSlot" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {revenueByTimeSlot.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIME_SLOT_COLORS[entry.timeSlot as keyof typeof TIME_SLOT_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Quantity Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Hourly Quantity Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyQuantity} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value.toLocaleString('en-IN'), 'Quantity']}
                />
                <Bar dataKey="quantity" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
