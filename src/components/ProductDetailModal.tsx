import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { ProductGrowthStats } from '../utils/comparisonUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { useData } from '../context/DataContext';
import { format, isSameDay, startOfDay } from 'date-fns';

interface ProductDetailModalProps {
  product: ProductGrowthStats | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { filteredData } = useData();

  const timeSeriesData = useMemo(() => {
    if (!product) return [];

    // Filter for this product
    const productRecords = filteredData.filter(r => r.productName === product.productName);
    
    // Group by date
    const dateMap = new Map<string, { date: Date; revenue: number; quantity: number }>();
    
    productRecords.forEach(r => {
      const dateKey = format(r.billDate, 'yyyy-MM-dd');
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: startOfDay(r.billDate), revenue: 0, quantity: 0 });
      }
      const entry = dateMap.get(dateKey)!;
      entry.revenue += r.totalAmount;
      entry.quantity += r.quantity;
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(d => ({
        date: format(d.date, 'MMM dd'),
        revenue: d.revenue,
        quantity: d.quantity
      }));
  }, [product, filteredData]);

  if (!product) return null;

  const comparisonData = [
    { name: 'Period A', revenue: product.revenueA, quantity: product.quantityA },
    { name: 'Period B', revenue: product.revenueB, quantity: product.quantityB },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{product.productName}</h3>
            <p className="text-sm text-slate-500">{product.category}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Revenue Growth</p>
              <p className={`text-2xl font-bold ${product.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {product.revenueGrowth >= 0 ? '+' : ''}{product.revenueGrowth.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Diff: {product.revenueDiff > 0 ? '+' : ''}₹{product.revenueDiff.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Quantity Growth</p>
              <p className={`text-2xl font-bold ${product.quantityGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {product.quantityGrowth >= 0 ? '+' : ''}{product.quantityGrowth.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Diff: {product.quantityA - product.quantityB} units
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Period Comparison Bar Chart */}
            <div className="h-64 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Period Comparison</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#F97316" tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} width={50} />
                  <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" width={40} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar yAxisId="right" dataKey="quantity" name="Quantity" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time Series Line Chart */}
            <div className="h-64 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Revenue Trend (All Time)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis stroke="#F97316" tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} width={50} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
