
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  normalizeRows,
  aggregateByDateProduct,
  AggregatedProductData,
  getMatchingWeekdayDates,
  aggregateProductAcrossDates,
  predictByWeekdayAverage,
  predictWeightedRecentAverage,
  predictExponentialSmoothing,
  predictSameWeekdayAverage,
  selectBestModel,
  applyBufferAndRounding,
  computeConfidence,
  calculateIngredientsNeeded,
  savePredictionRun,
  loadPredictionRuns,
  ProcessedPrediction,
  IngredientRequirement,
  PredictionModel,
  PredictionRun,
  PredictionResult
} from '../utils/prediction';
import { format } from 'date-fns';
import { useToast } from '../components/Toast';

export function usePrediction() {
  const { filteredData, closedDays } = useData();
  const { addToast } = useToast();

  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [model, setModel] = useState<PredictionModel>('auto');
  const [bufferPercent, setBufferPercent] = useState<number>(10);
  const [recentCount, setRecentCount] = useState<number>(4);
  const [recentWeight, setRecentWeight] = useState<number>(0.5);
  const [alpha, setAlpha] = useState<number>(0.3);
  const [excludeOutliers, setExcludeOutliers] = useState<boolean>(true);
  const [batchUnitMapping, setBatchUnitMapping] = useState<Record<string, number>>({});
  const [timeSlot, setTimeSlot] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening'>('All');
  
  const [predictions, setPredictions] = useState<ProcessedPrediction[]>([]);
  const [chartData, setChartData] = useState<AggregatedProductData[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRequirement[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRun, setLastRun] = useState<PredictionRun | null>(null);
  const [history, setHistory] = useState<PredictionRun[]>([]);

  // 1. Normalize Data (Memoized)
  const normalizedRows = useMemo(() => {
    if (!filteredData.length) return [];
    let rows = normalizeRows(filteredData);
    
    if (timeSlot !== 'All') {
      rows = rows.filter(r => r.timeSlot === timeSlot);
    }
    
    return rows;
  }, [filteredData, timeSlot]);

  // 2. Aggregate Data (Memoized)
  const aggregatedByDate = useMemo(() => {
    return aggregateByDateProduct(normalizedRows);
  }, [normalizedRows]);

  // Load history on mount
  useEffect(() => {
    setHistory(loadPredictionRuns());
  }, []);

  const runPrediction = useCallback(async () => {
    if (!normalizedRows.length) {
      addToast({ message: 'No data available for prediction', type: 'error' });
      return;
    }

    setIsRunning(true);
    
    try {
      // Simulate async for UI responsiveness
      await new Promise(resolve => setTimeout(resolve, 100));

      const targetDayOfWeek = targetDate.getDay();
      const matchingDates = getMatchingWeekdayDates(normalizedRows, targetDayOfWeek, 1, closedDays);
      
      // Fallback: Get all recent dates for fallback logic
      // We need a way to get "all recent dates" efficiently. 
      // Let's just use the last 30 dates from aggregatedByDate keys.
      const allDates = Object.keys(aggregatedByDate).sort();
      const recentDates = allDates.slice(-30);
      
      const productAggregates = aggregateProductAcrossDates(aggregatedByDate, matchingDates);
      const recentAggregates = aggregateProductAcrossDates(aggregatedByDate, recentDates);
      
      const rawPredictions = Object.values(productAggregates).map(agg => {
        let result: PredictionResult;
        let usedModel = model;
        let fallbackUsed: 'none' | 'product-weekday' | 'product-recent-overall' = 'none';

        // Check for insufficient data
        if (agg.daysAppeared < 3) {
          // Attempt Fallback: Product-Recent
          const recentAgg = recentAggregates[agg.productName];
          if (recentAgg && recentAgg.daysAppeared >= 3) {
             // Use weighted average on recent data
             result = predictWeightedRecentAverage(recentAgg, recentCount, recentWeight, { excludeOutliers });
             result.explanation = `Fallback (Recent): ${result.explanation}`;
             fallbackUsed = 'product-recent-overall';
             result.fallbackUsed = fallbackUsed;
          } else {
             // Not enough data even recently
             result = {
               predicted: 0,
               explanation: 'Insufficient historical data (weekday & recent).',
               confidence: 'Low',
               confidenceScore: 0,
               fallbackUsed: 'none'
             };
          }
        } else {
          // Sufficient weekday data
          fallbackUsed = 'product-weekday';
          
          if (model === 'auto') {
            usedModel = selectBestModel(agg, matchingDates.length, { recentCount, recentWeight, alpha, excludeOutliers });
          }

          switch (usedModel) {
            case 'average':
              result = predictByWeekdayAverage(agg, matchingDates.length, { excludeOutliers });
              break;
            case 'weighted':
              result = predictWeightedRecentAverage(agg, recentCount, recentWeight, { excludeOutliers });
              break;
            case 'exponential':
              result = predictExponentialSmoothing(agg, alpha, { excludeOutliers });
              break;
            case 'same-weekday':
              result = predictSameWeekdayAverage(agg, matchingDates, { excludeOutliers });
              break;
            default:
              result = predictWeightedRecentAverage(agg, recentCount, recentWeight, { excludeOutliers });
          }
          result.fallbackUsed = fallbackUsed;
        }
        
        // Add product name and category to result for post-processing
        return { 
          ...result, 
          productName: agg.productName,
          category: agg.category
        };
      });

      // Apply buffer and rounding
      const processed = applyBufferAndRounding(rawPredictions, bufferPercent, batchUnitMapping).map((p, i) => {
        // Re-compute confidence based on the aggregation used (weekday vs recent)
        const agg = p.fallbackUsed === 'product-recent-overall' 
          ? recentAggregates[p.productName] 
          : productAggregates[p.productName];
          
        const conf = (model === 'same-weekday' && p.fallbackUsed !== 'product-recent-overall') 
          ? { confidence: p.confidence, confidenceScore: p.confidenceScore } 
          : (agg ? computeConfidence(agg, p.fallbackUsed === 'product-recent-overall' ? recentDates.length : matchingDates.length) : { confidence: 'Low' as const, confidenceScore: 0 });
        
        return {
          ...p,
          confidence: conf.confidence,
          confidenceScore: conf.confidenceScore
        };
      });

      // Sort by predicted quantity desc
      processed.sort((a, b) => b.suggestedPrep - a.suggestedPrep);

      setPredictions(processed);

      // Prepare chart data for top 5 items
      const topItems = processed.slice(0, 5).map(p => p.productName);
      const topAggregates = topItems.map(name => productAggregates[name]).filter(Boolean);
      setChartData(topAggregates);

      // Calculate ingredients
      const reqs = calculateIngredientsNeeded(processed);
      setIngredients(reqs);

      // Save run
      const run: PredictionRun = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        targetDate: format(targetDate, 'yyyy-MM-dd'),
        options: {
          targetDate,
          model,
          bufferPercent,
          recentCount,
          recentWeight,
          alpha,
          batchUnitMapping,
          excludeOutliers,
          ignoreClosedDays: true
        },
        predictions: processed,
        ingredients: reqs
      };

      savePredictionRun(run);
      setLastRun(run);
      setHistory(prev => [run, ...prev]);
      
      addToast({ message: 'Prediction run completed', type: 'success' });

    } catch (error) {
      console.error('Prediction failed:', error);
      addToast({ message: 'Prediction failed', type: 'error' });
    } finally {
      setIsRunning(false);
    }
  }, [
    normalizedRows, 
    aggregatedByDate, 
    targetDate, 
    model, 
    bufferPercent, 
    recentCount, 
    recentWeight, 
    alpha, 
    addToast,
    closedDays,
    excludeOutliers,
    batchUnitMapping
  ]);

  const updatePredictionOverride = useCallback((productName: string, newPrep: number) => {
    setPredictions(prev => {
      const updated = prev.map(p => {
        if (p.productName === productName) {
          return {
            ...p,
            suggestedPrep: newPrep,
            roundedPrep: newPrep, // Assume manual override sets the final rounded value
            isManualOverride: true,
            originalPredicted: p.originalPredicted || p.suggestedPrep,
            notes: p.notes ? `${p.notes}, Manual Override` : 'Manual Override'
          };
        }
        return p;
      });
      
      // Recalculate ingredients based on new prep quantities
      const newReqs = calculateIngredientsNeeded(updated);
      setIngredients(newReqs);
      
      return updated;
    });
  }, []);

  return {
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
    batchUnitMapping,
    setBatchUnitMapping,
    timeSlot,
    setTimeSlot,
    predictions,
    chartData,
    ingredients,
    isRunning,
    runPrediction,
    updatePredictionOverride,
    history,
    lastRun
  };
}
