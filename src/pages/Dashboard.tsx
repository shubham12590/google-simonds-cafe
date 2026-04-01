import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

export const Dashboard: React.FC = () => {
  const { filteredData } = useData();

  const totalSales = useMemo(() => {
    return filteredData.reduce((sum, record) => sum + record.totalAmount, 0);
  }, [filteredData]);

  const totalQuantity = useMemo(() => {
    return filteredData.reduce((sum, record) => sum + record.quantity, 0);
  }, [filteredData]);

  const totalOrders = useMemo(() => {
    const uniqueOrders = new Set<string>();
    filteredData.forEach((record) => {
      if (record.billNo) {
        uniqueOrders.add(record.billNo);
      } else {
        // Fallback if no bill number is present
        uniqueOrders.add(`${record.billDate.getTime()}-${record.billTime}`);
      }
    });
    return uniqueOrders.size;
  }, [filteredData]);

  const averageOrderValue = useMemo(() => {
    if (totalOrders === 0) return 0;
    return totalSales / totalOrders;
  }, [totalSales, totalOrders]);

  const salesTrend = useMemo(() => {
    const trendMap = new Map<string, number>();
    filteredData.forEach((record) => {
      const dateStr = format(record.billDate, 'MMM dd');
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + record.totalAmount);
    });
    return Array.from(trendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData]);

  const categoryDistribution = useMemo(() => {
    const catMap = new Map<string, number>();
    filteredData.forEach((record) => {
      catMap.set(record.category, (catMap.get(record.category) || 0) + record.totalAmount);
    });
    return Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const hourlyRevenue = useMemo(() => {
    const hourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) hourMap.set(i, 0);
    filteredData.forEach((record) => {
      hourMap.set(record.hour, (hourMap.get(record.hour) || 0) + record.totalAmount);
    });
    return Array.from(hourMap.entries())
      .map(([hour, amount]) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        amount,
      }))
      .filter((item) => item.amount > 0);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 sm:mb-2">Total Sales</h3>
          <p className="text-xl sm:text-3xl font-bold text-slate-800 truncate">
            ₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 sm:mb-2">Total Orders</h3>
          <p className="text-xl sm:text-3xl font-bold text-slate-800 truncate">{totalOrders.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 sm:mb-2">Avg Order Value</h3>
          <p className="text-xl sm:text-3xl font-bold text-slate-800 truncate">
            ₹{averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 sm:mb-2">Total Quantity</h3>
          <p className="text-xl sm:text-3xl font-bold text-slate-800 truncate">{totalQuantity.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Sales Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Sales']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Category Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Sales']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#64748B' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Hourly Revenue</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
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
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
