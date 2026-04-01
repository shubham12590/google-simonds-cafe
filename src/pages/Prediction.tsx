
import React from 'react';
import { usePrediction } from '../hooks/usePrediction';
import { useData } from '../context/DataContext';
import { PredictionTable } from '../components/PredictionTable';
import { IngredientRequirementsPanel } from '../components/IngredientRequirementsPanel';
import { ModelSelector } from '../components/ModelSelector';
import { PredictionExport } from '../components/PredictionExport';
import { WeeklyPatternChart } from '../components/WeeklyPatternChart';
import { ClosedDayManager } from '../components/ClosedDayManager';
import { BatchUnitEditor } from '../components/BatchUnitEditor';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Calendar, Play, AlertTriangle, Clock } from 'lucide-react';

export const Prediction: React.FC = () => {
  const { closedDays, toggleClosedDay, availableProducts } = useData();
  const {
    targetDate,
    setTargetDate,
    model,
    setModel,
    bufferPercent,
    setBufferPercent,
    recentCount,
    setRecentCount,
    recentWeight,
    setRecentWeight,
    alpha,
    setAlpha,
    excludeOutliers,
    setExcludeOutliers,
    predictions,
    chartData,
    ingredients,
    isRunning,
    runPrediction,
    updatePredictionOverride,
    batchUnitMapping,
    setBatchUnitMapping,
    timeSlot,
    setTimeSlot
  } = usePrediction();

  const topPredictions = predictions.slice(0, 10).map(p => ({
    name: p.productName,
    quantity: p.suggestedPrep
  }));

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demand Prediction</h1>
          <p className="text-slate-500">Forecast daily sales and plan preparation.</p>
        </div>
        <div className="flex items-center gap-3">
          <BatchUnitEditor 
            products={availableProducts} 
            mapping={batchUnitMapping} 
            onSave={setBatchUnitMapping} 
          />
          <ClosedDayManager closedDays={closedDays} onToggleClosedDay={toggleClosedDay} />
          <PredictionExport predictions={predictions} />
          <button
            onClick={runPrediction}
            disabled={isRunning}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
              isRunning ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </>
            ) : (
              <>
                <Play className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Run Prediction
              </>
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={format(targetDate, 'yyyy-MM-dd')}
                    onChange={(e) => setTargetDate(new Date(e.target.value))}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Predicting for: <span className="font-medium text-slate-700">{format(targetDate, 'EEEE, MMMM do, yyyy')}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time Slot</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value as any)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  >
                    <option value="All">All Day</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Safety Buffer: {bufferPercent}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={bufferPercent}
                  onChange={(e) => setBufferPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Adds a percentage to the predicted value to prevent stockouts.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="excludeOutliers"
                  checked={excludeOutliers}
                  onChange={(e) => setExcludeOutliers(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                />
                <label htmlFor="excludeOutliers" className="text-sm text-slate-700">
                  Exclude Outliers (Winsorize)
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <ModelSelector
            model={model}
            setModel={setModel}
            recentCount={recentCount}
            setRecentCount={setRecentCount}
            recentWeight={recentWeight}
            setRecentWeight={setRecentWeight}
            alpha={alpha}
            setAlpha={setAlpha}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Table & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {chartData.length > 0 && (
            <CollapsibleSection title={`Historical Pattern (${format(targetDate, 'EEEE')}s)`} defaultOpen={false}>
              <WeeklyPatternChart 
                data={chartData} 
                targetWeekday={targetDate.getDay()} 
              />
            </CollapsibleSection>
          )}

          {topPredictions.length > 0 && !chartData.length && (
            <CollapsibleSection title="Top Predicted Items" defaultOpen={false}>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPredictions} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80} 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="quantity" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection title="Prediction Results" defaultOpen={true}>
            <PredictionTable
              predictions={predictions}
              onOverride={updatePredictionOverride}
            />
          </CollapsibleSection>
        </div>

        {/* Right Column: Ingredients */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <CollapsibleSection title="Ingredient Requirements" defaultOpen={false} className="lg:block" headerClassName="lg:hidden">
              <IngredientRequirementsPanel ingredients={ingredients} />
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
};
