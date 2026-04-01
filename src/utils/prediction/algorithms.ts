
import { AggregatedProductData, PredictionResult, PredictionModel, ConfidenceLevel } from './types';
import { winsorize } from './outliers';

export function predictSameWeekdayAverage(
  aggregated: AggregatedProductData,
  matchingDates: string[],
  options: { excludeOutliers?: boolean } = {}
): PredictionResult {
  const last9Dates = matchingDates.slice(-9);
  
  if (last9Dates.length === 0) {
    return { 
      predicted: 0, 
      explanation: 'No matching days found.',
      confidence: 'Low',
      confidenceScore: 0,
      fallbackUsed: 'none'
    };
  }

  let quantities: number[] = [];
  for (const date of last9Dates) {
    const index = aggregated.dates.indexOf(date);
    if (index !== -1) {
      quantities.push(aggregated.dailyQuantities[index]);
    } else {
      quantities.push(0);
    }
  }

  const sorted = [...quantities].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  if (options.excludeOutliers) {
    quantities = quantities.filter(v => v <= 2 * median);
  }

  const n = quantities.length;
  if (n === 0) {
    return { 
      predicted: 0, 
      explanation: 'All data points were removed as outliers.',
      confidence: 'Low',
      confidenceScore: 0,
      fallbackUsed: 'none'
    };
  }

  const total = quantities.reduce((a, b) => a + b, 0);
  const avg = total / n;
  const predicted = Math.round(avg);

  const mean = total / n;
  let variance = 0;
  if (n > 1) {
    variance = quantities.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  }
  const stdDev = Math.sqrt(variance);
  const cv = mean === 0 ? 0 : stdDev / mean;
  
  let confidence: ConfidenceLevel = 'Medium';
  if (n < 3) {
    confidence = 'Low';
  } else if (cv < 0.2) {
    confidence = 'High';
  } else if (cv < 0.5) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  return {
    predicted,
    explanation: `Same Weekday Average based on last ${last9Dates.length} matching days.`,
    confidence,
    confidenceScore: cv,
    fallbackUsed: 'product-weekday',
    meta: { avg: predicted, median, cv }
  };
}

// Helper to calculate MAPE
function calculateMAPE(actual: number, predicted: number): number {
  if (actual === 0) return 0; // Avoid division by zero
  return Math.abs((actual - predicted) / actual);
}

export function predictByWeekdayAverage(
  aggregated: AggregatedProductData,
  nMatchingDays: number,
  options: { excludeOutliers?: boolean } = {}
): PredictionResult {
  if (nMatchingDays === 0) {
    return { 
      predicted: 0, 
      explanation: 'No matching days found.',
      confidence: 'Low',
      confidenceScore: 0,
      fallbackUsed: 'none'
    };
  }
  
  let quantities = aggregated.dailyQuantities;
  if (options.excludeOutliers) {
    quantities = winsorize(quantities);
  }

  const total = quantities.reduce((a, b) => a + b, 0);
  const predicted = total / nMatchingDays; // Use nMatchingDays to account for zeros if they are part of the set? 
  // Wait, aggregated.dailyQuantities usually only contains non-zero sales if derived from transaction rows.
  // If we want to include days with 0 sales (but open), we need to know nMatchingDays.
  // The average should be total / nMatchingDays (assuming 0 for missing days).
  
  return {
    predicted,
    explanation: `Average of ${total} items over ${nMatchingDays} matching days.`,
    confidence: 'Medium', // Placeholder, computed later
    confidenceScore: 0,
    fallbackUsed: 'product-weekday',
    meta: { avg: predicted }
  };
}

export function predictWeightedRecentAverage(
  aggregated: AggregatedProductData,
  recentCount: number = 4,
  recentWeight: number = 0.5,
  options: { excludeOutliers?: boolean } = {}
): PredictionResult {
  let { dailyQuantities } = aggregated;
  
  if (dailyQuantities.length === 0) {
    return { 
      predicted: 0, 
      explanation: 'No data.',
      confidence: 'Low',
      confidenceScore: 0,
      fallbackUsed: 'none'
    };
  }

  if (options.excludeOutliers) {
    dailyQuantities = winsorize(dailyQuantities);
  }

  // Assume dailyQuantities are sorted by date (ascending)
  const n = dailyQuantities.length;
  const recentStart = Math.max(0, n - recentCount);
  
  const recentData = dailyQuantities.slice(recentStart);
  const olderData = dailyQuantities.slice(0, recentStart);

  const recentAvg = recentData.length > 0 
    ? recentData.reduce((a, b) => a + b, 0) / recentData.length 
    : 0;

  const olderAvg = olderData.length > 0 
    ? olderData.reduce((a, b) => a + b, 0) / olderData.length 
    : 0;

  let predicted: number;
  let explanation: string;

  if (olderData.length === 0) {
    predicted = recentAvg;
    explanation = `Based on recent average of ${recentAvg.toFixed(1)} (only ${recentData.length} days available).`;
  } else {
    predicted = (recentAvg * recentWeight) + (olderAvg * (1 - recentWeight));
    explanation = `Weighted: ${recentWeight * 100}% recent (${recentAvg.toFixed(1)}) + ${(1 - recentWeight) * 100}% older (${olderAvg.toFixed(1)}).`;
  }

  return {
    predicted,
    explanation,
    confidence: 'Medium',
    confidenceScore: 0,
    fallbackUsed: 'product-weekday',
    meta: { recentAvg, olderAvg }
  };
}

export function predictExponentialSmoothing(
  aggregated: AggregatedProductData,
  alpha: number = 0.3,
  options: { excludeOutliers?: boolean } = {}
): PredictionResult {
  let { dailyQuantities } = aggregated;
  
  if (dailyQuantities.length === 0) {
    return { 
      predicted: 0, 
      explanation: 'No data.',
      confidence: 'Low',
      confidenceScore: 0,
      fallbackUsed: 'none'
    };
  }

  if (options.excludeOutliers) {
    dailyQuantities = winsorize(dailyQuantities);
  }

  let level = dailyQuantities[0]; // Initialize with first observation
  
  for (let i = 1; i < dailyQuantities.length; i++) {
    level = alpha * dailyQuantities[i] + (1 - alpha) * level;
  }

  return {
    predicted: level,
    explanation: `Exponential smoothing with alpha=${alpha}. Final level: ${level.toFixed(1)}.`,
    confidence: 'Medium',
    confidenceScore: 0,
    fallbackUsed: 'product-weekday',
    meta: { alpha, finalLevel: level }
  };
}

/**
 * Evaluates models on the last N points of data to find the best fit.
 * Returns the best model name.
 */
export function selectBestModel(
  aggregated: AggregatedProductData,
  nMatchingDays: number,
  options: { recentCount: number; recentWeight: number; alpha: number; excludeOutliers: boolean }
): PredictionModel {
  const { dailyQuantities } = aggregated;
  if (dailyQuantities.length < 4) return 'weighted'; // Not enough data to evaluate

  // We'll use a simple backtesting strategy:
  // Predict the last 3 points using the data available prior to them.
  const testPoints = 3;
  const errors: Record<string, number> = { average: 0, weighted: 0, exponential: 0 };

  for (let i = 0; i < testPoints; i++) {
    const splitIndex = dailyQuantities.length - (testPoints - i);
    if (splitIndex < 1) continue;

    const trainData = dailyQuantities.slice(0, splitIndex);
    const actual = dailyQuantities[splitIndex];
    
    // Mock aggregated data for training
    const trainAgg: AggregatedProductData = {
      ...aggregated,
      dailyQuantities: trainData,
      totalQuantity: trainData.reduce((a, b) => a + b, 0),
      daysAppeared: trainData.length
    };

    // 1. Average
    const predAvg = predictByWeekdayAverage(trainAgg, nMatchingDays - (testPoints - i), options).predicted;
    errors.average += calculateMAPE(actual, predAvg);

    // 2. Weighted
    const predWeighted = predictWeightedRecentAverage(trainAgg, options.recentCount, options.recentWeight, options).predicted;
    errors.weighted += calculateMAPE(actual, predWeighted);

    // 3. Exponential
    const predExp = predictExponentialSmoothing(trainAgg, options.alpha, options).predicted;
    errors.exponential += calculateMAPE(actual, predExp);

    // 4. Same Weekday
    // We need matching dates for the trainAgg. We can mock it by taking the dates from trainAgg.
    const predSameWeekday = predictSameWeekdayAverage(trainAgg, trainAgg.dates, options).predicted;
    errors['same-weekday'] = (errors['same-weekday'] || 0) + calculateMAPE(actual, predSameWeekday);
  }

  // Find model with min error
  let bestModel: PredictionModel = 'weighted';
  let minError = Infinity;

  Object.entries(errors).forEach(([model, error]) => {
    if (error < minError) {
      minError = error;
      bestModel = model as PredictionModel;
    }
  });

  return bestModel;
}
