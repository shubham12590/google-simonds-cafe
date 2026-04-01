import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

export const ProductPerformance: React.FC = () => {
  const { filteredData } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'revenue',
    direction: 'desc',
  });

  const productStats = useMemo(() => {
    const statsMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();
    filteredData.forEach((record) => {
      if (!statsMap.has(record.productName)) {
        statsMap.set(record.productName, {
          name: record.productName,
          category: record.category,
          quantity: 0,
          revenue: 0,
        });
      }
      const stat = statsMap.get(record.productName)!;
      stat.quantity += record.quantity;
      stat.revenue += record.totalAmount;
    });
    return Array.from(statsMap.values());
  }, [filteredData]);

  const sortedProducts = useMemo(() => {
    const sorted = [...productStats].sort((a, b) => {
      if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [productStats, sortConfig]);

  const topByRevenue = useMemo(() => {
    return [...productStats].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [productStats]);

  const topByQuantity = useMemo(() => {
    return [...productStats].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  }, [productStats]);

  const top5Products = useMemo(() => {
    return [...productStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => p.name);
  }, [productStats]);

  const trendData = useMemo(() => {
    if (top5Products.length === 0) return [];

    const dateMap = new Map<string, any>();
    
    filteredData.forEach(record => {
      if (top5Products.includes(record.productName)) {
        const dateKey = format(record.billDate, 'yyyy-MM-dd');
        if (!dateMap.has(dateKey)) {
          const newEntry: any = { 
            dateKey, 
            displayDate: format(record.billDate, 'MMM dd') 
          };
          top5Products.forEach(p => {
            newEntry[p] = 0;
          });
          dateMap.set(dateKey, newEntry);
        }
        const dateEntry = dateMap.get(dateKey);
        dateEntry[record.productName] += record.totalAmount;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => {
      return new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime();
    });
  }, [filteredData, top5Products]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6">
      {/* Sales Trend for Top 5 Products */}
      {trendData.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Sales Trend (Top 5 Products by Revenue)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, undefined]}
                  labelStyle={{ color: '#475569', fontWeight: 600, marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                {top5Products.map((productName, index) => (
                  <Line 
                    key={productName}
                    type="monotone" 
                    dataKey={productName} 
                    name={productName}
                    stroke={COLORS[index % COLORS.length]} 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Products by Revenue */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 10 Products by Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topByRevenue} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#F97316" radius={[0, 4, 4, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products by Quantity */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 10 Products by Quantity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topByQuantity} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value.toLocaleString('en-IN'), 'Quantity']}
                />
                <Bar dataKey="quantity" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Product Performance Details</h3>
          <div className="md:hidden text-xs text-slate-500">
            Sort by: 
            <select 
              className="ml-2 bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
              value={sortConfig.key}
              onChange={(e) => requestSort(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="quantity">Quantity</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {sortedProducts.map((product, index) => (
            <div key={index} className="p-4 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 text-base">{product.name}</h4>
                  <div className="text-sm text-slate-500 mt-0.5">{product.category}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-50">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Quantity</div>
                  <div className="font-medium text-slate-800">{product.quantity.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Revenue</div>
                  <div className="font-medium text-slate-800">
                    ₹{product.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sortedProducts.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No products found for the selected filters.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs sm:text-sm uppercase tracking-wider">
                <th
                  className="p-3 sm:p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => requestSort('name')}
                >
                  Product Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-3 sm:p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => requestSort('category')}
                >
                  Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-3 sm:p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors text-right whitespace-nowrap"
                  onClick={() => requestSort('quantity')}
                >
                  Quantity {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-3 sm:p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors text-right whitespace-nowrap"
                  onClick={() => requestSort('revenue')}
                >
                  Revenue {sortConfig.key === 'revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm sm:text-base">
              {sortedProducts.map((product, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 sm:p-4 text-slate-800 font-medium">{product.name}</td>
                  <td className="p-3 sm:p-4 text-slate-500">{product.category}</td>
                  <td className="p-3 sm:p-4 text-slate-800 text-right">{product.quantity.toLocaleString('en-IN')}</td>
                  <td className="p-3 sm:p-4 text-slate-800 text-right">
                    ₹{product.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No products found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
