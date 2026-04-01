import React from 'react';
import { useComparison } from '../hooks/useComparison';
import { ExecutiveKpis } from '../components/ExecutiveKpis';
import { ProductGrowthTable } from '../components/ProductGrowthTable';
import { CategoryContributionChart } from '../components/CategoryContributionChart';
import { GrowthDriverChart } from '../components/GrowthDriverChart';
import { RiskProductsPanel } from '../components/RiskProductsPanel';
import { InsightsPanel } from '../components/InsightsPanel';
import { Calendar, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export const Comparison: React.FC = () => {
  const {
    periodA,
    setPeriodA,
    periodB,
    setPeriodB,
    statsA,
    statsB,
    productGrowth,
    categoryGrowth,
    risks,
    insights,
    topDrivers,
    topDecliners
  } = useComparison();

  const handleDateChange = (period: 'A' | 'B', field: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : null;
    if (period === 'A') {
      setPeriodA(prev => ({ ...prev, [field]: date }));
    } else {
      setPeriodB(prev => ({ ...prev, [field]: date }));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative z-20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Performance Comparison</h2>
            <p className="text-slate-500 text-sm mt-1">Analyze growth drivers, risks, and trends across two periods.</p>
          </div>
          
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full lg:w-auto">
            {/* Period A Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 w-full xl:w-auto">
              <span className="text-xs font-bold text-orange-600 uppercase px-2 whitespace-nowrap">Current (A)</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                  type="date" 
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none w-full sm:w-auto"
                  value={periodA.start ? format(periodA.start, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('A', 'start', e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none w-full sm:w-auto"
                  value={periodA.end ? format(periodA.end, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('A', 'end', e.target.value)}
                />
              </div>
            </div>

            <span className="text-slate-400 font-medium text-sm hidden xl:block">vs</span>

            {/* Period B Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 w-full xl:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase px-2 whitespace-nowrap">Previous (B)</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                  type="date" 
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none w-full sm:w-auto"
                  value={periodB.start ? format(periodB.start, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('B', 'start', e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none w-full sm:w-auto"
                  value={periodB.end ? format(periodB.end, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('B', 'end', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 self-end xl:self-auto">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <RefreshCw size={18} />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive KPIs */}
      <ExecutiveKpis statsA={statsA} statsB={statsB} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Analytics & Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GrowthDriverChart 
              data={topDrivers} 
              title="Top Growth Drivers (Revenue)" 
              type="driver" 
            />
            <GrowthDriverChart 
              data={topDecliners} 
              title="Top Decliners (Revenue)" 
              type="decline" 
            />
          </div>
          
          <ProductGrowthTable data={productGrowth} />
        </div>

        {/* Right Column: Insights & Risks */}
        <div className="space-y-6">
          <InsightsPanel insights={insights} />
          <RiskProductsPanel data={risks} />
          <CategoryContributionChart data={categoryGrowth} />
        </div>
      </div>
    </div>
  );
};
