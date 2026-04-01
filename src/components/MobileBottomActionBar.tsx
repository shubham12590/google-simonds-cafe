import React, { useState } from 'react';
import { UploadCloud, TrendingUp, Filter, MapPin, X, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import { FileUploadButton } from './FileUploadButton';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';

interface MobileBottomActionBarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const MobileBottomActionBar: React.FC<MobileBottomActionBarProps> = ({ activePage, setActivePage }) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('all');
  const { locations, activeLocationId, setActiveLocationId, availableCategories, availableProducts, filters, setFilters } = useData();

  const handlePredefinedRange = (range: string) => {
    setSelectedRange(range);
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = today;

    if (range === 'last7') {
      start = subDays(today, 6);
    } else if (range === 'last30') {
      start = subDays(today, 29);
    } else if (range === 'thisMonth') {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else if (range === 'all') {
      start = null;
      end = null;
    }

    if (range !== 'custom') {
      setFilters((prev) => ({ ...prev, dateRange: { start, end } }));
    }
  };

  return (
    <>
      {/* Filters Bottom Sheet */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsFiltersOpen(false)} />
          <div className="relative bg-white rounded-t-2xl p-4 pb-8 shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button onClick={() => setIsFiltersOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
                  <MapPin size={18} className="text-slate-400" />
                  <select
                    className="bg-transparent text-base font-medium text-slate-700 focus:outline-none w-full"
                    value={activeLocationId}
                    onChange={(e) => setActiveLocationId(e.target.value)}
                  >
                    <option value="all">All Locations</option>
                    {locations.filter(l => l.isActive).map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {activePage !== 'prediction' && activePage !== 'locations' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                    <div className="flex flex-col gap-2">
                      <select
                        className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-base focus:outline-none w-full"
                        value={selectedRange}
                        onChange={(e) => handlePredefinedRange(e.target.value)}
                      >
                        <option value="all">All Time</option>
                        <option value="last7">Last 7 Days</option>
                        <option value="last30">Last 30 Days</option>
                        <option value="thisMonth">This Month</option>
                        <option value="custom">Custom Range</option>
                      </select>

                      {selectedRange === 'custom' && (
                        <div className="flex items-center gap-2 w-full">
                          <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                              type="date"
                              className="pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none w-full"
                              value={filters.dateRange.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null },
                                }))
                              }
                            />
                          </div>
                          <span className="text-slate-400">-</span>
                          <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                              type="date"
                              className="pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none w-full"
                              value={filters.dateRange.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : ''}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : null },
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-base focus:outline-none w-full"
                      value={filters.categories[0] || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          categories: e.target.value ? [e.target.value] : [],
                        }))
                      }
                    >
                      <option value="">All Categories</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                    <select
                      className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-base focus:outline-none w-full"
                      value={filters.productNames[0] || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          productNames: e.target.value ? [e.target.value] : [],
                        }))
                      }
                    >
                      <option value="">All Products</option>
                      {availableProducts.map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <button 
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium mt-2"
              onClick={() => setIsFiltersOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 pb-safe flex items-center justify-around z-40 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex-1 flex justify-center">
          <FileUploadButton variant="bottom-bar" />
        </div>
        
        <div className="flex-1 flex justify-center">
          <button 
            onClick={() => setActivePage('prediction')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${activePage === 'prediction' ? 'text-orange-500' : 'text-slate-500'}`}
          >
            <TrendingUp size={24} />
            <span className="text-[10px] font-medium mt-1">Predict</span>
          </button>
        </div>
        
        <div className="flex-1 flex justify-center">
          <button 
            onClick={() => setIsFiltersOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg w-full text-slate-500"
          >
            <Filter size={24} />
            <span className="text-[10px] font-medium mt-1">Filters</span>
          </button>
        </div>
      </div>
    </>
  );
};
