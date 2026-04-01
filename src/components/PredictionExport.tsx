
import React from 'react';
import { ProcessedPrediction } from '../utils/prediction/types';
import { Download } from 'lucide-react';

interface PredictionExportProps {
  predictions: ProcessedPrediction[];
}

export const PredictionExport: React.FC<PredictionExportProps> = ({ predictions }) => {
  const handleExport = () => {
    if (predictions.length === 0) return;

    const csvContent = [
      ['Product Name', 'Predicted Quantity', 'Suggested Prep', 'Confidence', 'Explanation'],
      ...predictions.map(p => [
        p.productName,
        p.predictedQuantity,
        p.suggestedPrep,
        p.confidence,
        p.explanation
      ])
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prediction_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
    >
      <Download className="-ml-1 mr-2 h-5 w-5 text-slate-500" aria-hidden="true" />
      Export CSV
    </button>
  );
};
