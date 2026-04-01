
import React from 'react';
import { PredictionModel } from '../utils/prediction/types';

interface ModelSelectorProps {
  model: PredictionModel;
  setModel: (model: PredictionModel) => void;
  recentCount: number;
  setRecentCount: (n: number) => void;
  recentWeight: number;
  setRecentWeight: (n: number) => void;
  alpha: number;
  setAlpha: (n: number) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  model,
  setModel,
  recentCount,
  setRecentCount,
  recentWeight,
  setRecentWeight,
  alpha,
  setAlpha
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
      <h3 className="font-semibold text-slate-800">Prediction Model</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {(['average', 'weighted', 'exponential', 'auto', 'same-weekday'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModel(m)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              model === m
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {m === 'same-weekday' ? 'Same Weekday Average' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {model === 'weighted' && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Recent Days to Consider: {recentCount}
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={recentCount}
              onChange={(e) => setRecentCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Recent Weight: {(recentWeight * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={recentWeight}
              onChange={(e) => setRecentWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>
      )}

      {model === 'exponential' && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Smoothing Factor (Alpha): {alpha}
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Higher alpha reacts faster to recent changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
