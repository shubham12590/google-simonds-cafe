
import { PredictionRun } from './types';

const STORAGE_KEY = 'simonds_prediction_runs';

export function savePredictionRun(run: PredictionRun): void {
  try {
    const existing = loadPredictionRuns();
    existing.push(run);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to save prediction run:', error);
  }
}

export function loadPredictionRuns(): PredictionRun[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load prediction runs:', error);
    return [];
  }
}

export function getPredictionRun(id: string): PredictionRun | undefined {
  const runs = loadPredictionRuns();
  return runs.find(r => r.id === id);
}

export function deletePredictionRun(id: string): void {
  const runs = loadPredictionRuns();
  const filtered = runs.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
