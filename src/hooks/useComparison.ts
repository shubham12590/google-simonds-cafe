import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  aggregateByProduct, 
  aggregateByCategory, 
  calculatePeriodStats, 
  filterDataByDateRange, 
  identifyRisks, 
  generateInsights,
  ProductGrowthStats,
  CategoryGrowthStats,
  PeriodStats
} from '../utils/comparisonUtils';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

export const useComparison = () => {
  const { filteredData } = useData();
  
  // Default to Last 7 Days vs Previous 7 Days
  const today = new Date();
  const [periodA, setPeriodA] = useState<{ start: Date | null; end: Date | null }>({
    start: subDays(today, 6),
    end: today
  });
  const [periodB, setPeriodB] = useState<{ start: Date | null; end: Date | null }>({
    start: subDays(today, 13),
    end: subDays(today, 7)
  });

  const dataA = useMemo(() => filterDataByDateRange(filteredData, periodA.start, periodA.end), [filteredData, periodA]);
  const dataB = useMemo(() => filterDataByDateRange(filteredData, periodB.start, periodB.end), [filteredData, periodB]);

  const statsA = useMemo(() => calculatePeriodStats(dataA), [dataA]);
  const statsB = useMemo(() => calculatePeriodStats(dataB), [dataB]);

  const productGrowth = useMemo(() => aggregateByProduct(dataA, dataB), [dataA, dataB]);
  const categoryGrowth = useMemo(() => aggregateByCategory(dataA, dataB), [dataA, dataB]);

  const risks = useMemo(() => identifyRisks(productGrowth), [productGrowth]);
  const insights = useMemo(() => generateInsights(productGrowth, statsA, statsB), [productGrowth, statsA, statsB]);

  const topDrivers = useMemo(() => 
    [...productGrowth].sort((a, b) => b.revenueDiff - a.revenueDiff).slice(0, 5), 
    [productGrowth]
  );

  const topDecliners = useMemo(() => 
    [...productGrowth].sort((a, b) => a.revenueDiff - b.revenueDiff).slice(0, 5), 
    [productGrowth]
  );

  return {
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
  };
};
