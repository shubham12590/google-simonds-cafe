
import { ProcessedPrediction, PredictionResult, AggregatedProductData, ConfidenceLevel, FallbackStrategy } from './types';

export function computeConfidence(
  aggregated: AggregatedProductData,
  nMatchingDays: number
): { confidence: ConfidenceLevel; confidenceScore: number; frequency: number } {
  const { dailyQuantities, daysAppeared } = aggregated;
  
  // Frequency: daysAppeared / nMatchingDays
  const frequency = nMatchingDays > 0 ? daysAppeared / nMatchingDays : 0;

  if (daysAppeared < 2) {
    return { confidence: 'Low', confidenceScore: 1, frequency };
  }

  const mean = dailyQuantities.reduce((a, b) => a + b, 0) / daysAppeared;
  
  // Variance
  const variance = dailyQuantities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / daysAppeared;
  const stdDev = Math.sqrt(variance);
  
  // CV (Coefficient of Variation)
  const cv = mean > 0 ? stdDev / mean : 0;

  // Rules:
  // High: frequency >= 0.8 && cv <= 0.4
  // Medium: frequency >= 0.5 && cv <= 0.7
  // Low: otherwise
  
  let confidence: ConfidenceLevel = 'Low';
  if (frequency >= 0.8 && cv <= 0.4) confidence = 'High';
  else if (frequency >= 0.5 && cv <= 0.7) confidence = 'Medium';

  return { confidence, confidenceScore: cv, frequency };
}

export function applyBufferAndRounding(
  predictions: (PredictionResult & { productName: string; category: string })[],
  bufferPercent: number = 10,
  batchUnitMapping: Record<string, number> = {}
): ProcessedPrediction[] {
  return predictions.map(pred => {
    const { predicted, explanation, productName, category, confidence, confidenceScore, fallbackUsed } = pred;
    
    // Formula: prepQuantity = ceil( round(predicted) * (1 + bufferPercent/100) / batchUnit ) * batchUnit
    
    const basePredicted = Math.round(predicted);
    const bufferMultiplier = 1 + (bufferPercent / 100);
    const buffered = basePredicted * bufferMultiplier;
    
    const batchUnit = batchUnitMapping[productName] || 1;
    
    const roundedPrep = Math.round(Math.ceil(buffered / batchUnit) * batchUnit);
    
    const bufferApplied = roundedPrep - basePredicted;

    return {
      productName,
      category,
      predictedQuantity: predicted,
      suggestedPrep: roundedPrep,
      roundedPrep,
      batchUnit,
      bufferApplied,
      confidence,
      confidenceScore,
      fallbackUsed,
      explanation,
      notes: `Buffer: ${bufferPercent}%`
    };
  });
}
