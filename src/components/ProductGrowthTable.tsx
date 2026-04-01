import React, { useMemo, useState } from 'react';
import { ProductGrowthStats } from '../utils/comparisonUtils';
import { ArrowUpDown, Search, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductGrowthTableProps {
  data: ProductGrowthStats[];
}

export const ProductGrowthTable: React.FC<ProductGrowthTableProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProductGrowthStats; direction: 'asc' | 'desc' }>({
    key: 'revenueDiff',
    direction: 'desc',
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductGrowthStats | null>(null);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((p) => p.productName.toLowerCase().includes(lowerQuery) || p.category.toLowerCase().includes(lowerQuery));
    }

    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [data, searchQuery, sortConfig]);

  const handleSort = (key: keyof ProductGrowthStats) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Product Growth Details</h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('productName')}>
                  <div className="flex items-center gap-1">Product <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort('revenueA')}>
                  <div className="flex items-center justify-end gap-1">Rev A <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort('revenueB')}>
                  <div className="flex items-center justify-end gap-1">Rev B <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort('revenueDiff')}>
                  <div className="flex items-center justify-end gap-1">Diff <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort('revenueGrowth')}>
                  <div className="flex items-center justify-end gap-1">Growth % <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort('contributionShift')}>
                  <div className="flex items-center justify-end gap-1">Contr. Shift <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredData.map((row) => (
                <tr key={row.productName} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {row.productName}
                    <span className="block text-xs text-slate-400 font-normal">{row.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right">{formatCurrency(row.revenueA)}</td>
                  <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(row.revenueB)}</td>
                  <td className={`px-6 py-4 text-right font-medium ${row.revenueDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {row.revenueDiff > 0 ? '+' : ''}{formatCurrency(row.revenueDiff)}
                  </td>
                  <td className={`px-6 py-4 text-right ${row.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {row.revenueGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatPercent(Math.abs(row.revenueGrowth))}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right ${row.contributionShift >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {row.contributionShift > 0 ? '+' : ''}{row.contributionShift.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedProduct(row)}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </>
  );
};
