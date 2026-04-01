
import { SaleRecord } from '../../types';

export interface NormalizedRow extends SaleRecord {
  dayOfWeek: number; // 0-6
  dateKey: string; // YYYY-MM-DD
}

export interface AggregatedProductData {
  productName: string;
  totalQuantity: number;
  daysAppeared: number;
  dailyQuantities: number[]; // Array of quantities for matching days
  dates: string[]; // Array of dates corresponding to dailyQuantities
  revenue: number;
  category: string; // Added for category-level fallbacks
}

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type FallbackStrategy = 
  | 'product-weekday' 
  | 'product-recent-overall' 
  | 'category-weekday' 
  | 'product-all-days-average' 
  | 'manager_override'
  | 'none';

export interface PredictionResult {
  predicted: number;
  explanation: string;
  confidence: ConfidenceLevel;
  confidenceScore: number; // CV or similar metric
  fallbackUsed: FallbackStrategy;
  meta?: any; // Store intermediate values like averages
}

export interface ProcessedPrediction {
  productName: string;
  category: string;
  predictedQuantity: number; // Raw prediction
  suggestedPrep: number; // After buffer and rounding
  roundedPrep: number; // Final integer value
  batchUnit: number;
  bufferApplied: number; // The buffer amount added
  confidence: ConfidenceLevel;
  confidenceScore: number;
  fallbackUsed: FallbackStrategy;
  explanation: string;
  notes?: string;
  isManualOverride?: boolean;
  originalPredicted?: number; // In case of override
}

export interface RecipeItem {
  ingredient: string;
  qtyPerUnit: number;
  unit: string;
}

export interface IngredientRequirement {
  ingredient: string;
  need: number;
  unit: string;
  inStock?: number;
  toOrder: number;
  supplier?: string;
}

export type PredictionModel = 'average' | 'weighted' | 'exponential' | 'auto' | 'same-weekday';

export interface RunOptions {
  targetDate: Date;
  model: PredictionModel;
  bufferPercent: number;
  recentCount?: number; // For weighted average
  recentWeight?: number; // For weighted average
  alpha?: number; // For exponential smoothing
  batchUnitMapping?: Record<string, number>;
  excludeOutliers?: boolean;
  ignoreClosedDays?: boolean;
}

export interface PredictionRun {
  id: string;
  date: string; // ISO string of run time
  targetDate: string; // YYYY-MM-DD
  options: RunOptions;
  predictions: ProcessedPrediction[];
  ingredients: IngredientRequirement[];
}
