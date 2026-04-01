import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, Clock, ArrowLeftRight, Menu, X, UploadCloud, Calendar, Database, TrendingUp, MapPin, Settings } from 'lucide-react';
import { useData } from '../context/DataContext';
import { parseExcelFile } from '../utils/excelParser';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';
import { FileManagementModal } from './FileManagementModal';
import { FileUploadButton } from './FileUploadButton';
import { useToast } from './Toast';
import { MobileBottomActionBar } from './MobileBottomActionBar';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('all');
  const { availableCategories, availableProducts, filters, setFilters, files, locations, activeLocationId, setActiveLocationId } = useData();
  const { addToast } = useToast();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'product', label: 'Product Performance', icon: BarChart3 },
    { id: 'time', label: 'Time Analysis', icon: Clock },
    { id: 'comparison', label: 'Comparison', icon: ArrowLeftRight },
    { id: 'prediction', label: 'Demand Prediction', icon: TrendingUp },
    { id: 'locations', label: 'Locations', icon: MapPin },
  ];

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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-orange-500 tracking-tight">Simonds Insights</h1>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Manage Files Button */}
          <button
            onClick={() => {
              setIsFilesModalOpen(true);
              setIsSidebarOpen(false);
            }}
            className="flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-colors text-slate-300 hover:bg-slate-700 hover:text-white mt-4"
          >
            <Database size={20} />
            <span>Manage Files ({files.length})</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Global Filters */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 shadow-sm">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-slate-500 hover:text-slate-800 p-1 -ml-1"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open Menu"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                {navItems.find((i) => i.id === activePage)?.label}
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 hidden lg:flex">
            {/* Global Location Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <MapPin size={16} className="text-slate-400" />
              <select
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none w-full sm:w-auto"
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

            {activePage !== 'prediction' && activePage !== 'locations' && (
              <>
                {/* Date Range Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <select
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full sm:w-auto"
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
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="date"
                          className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full"
                          value={filters.dateRange.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null },
                            }))
                          }
                        />
                      </div>
                      <span className="text-slate-400 hidden sm:inline">-</span>
                      <div className="relative flex-1 sm:flex-none">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="date"
                          className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full"
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

                {/* Category Filter */}
                <select
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full sm:max-w-[150px]"
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

                {/* Product Filter */}
                <select
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full sm:max-w-[150px]"
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
              </>
            )}
            
            {/* Desktop Upload Button */}
            <div className="hidden sm:block ml-auto pl-2 border-l border-slate-200">
              <FileUploadButton variant="full" />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 pb-24 lg:pb-6">
          {children}
        </div>
      </main>

      <MobileBottomActionBar activePage={activePage} setActivePage={setActivePage} />

      <FileManagementModal isOpen={isFilesModalOpen} onClose={() => setIsFilesModalOpen(false)} />
    </div>
  );
};
