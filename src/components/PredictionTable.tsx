
import React, { useState } from 'react';
import { ProcessedPrediction } from '../utils/prediction/types';
import { Edit2, Check, X, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface PredictionTableProps {
  predictions: ProcessedPrediction[];
  onOverride: (productName: string, newPrep: number) => void;
}

export const PredictionTable: React.FC<PredictionTableProps> = ({ predictions, onOverride }) => {
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleEdit = (product: ProcessedPrediction) => {
    setEditingProduct(product.productName);
    setEditValue(product.suggestedPrep.toString());
  };

  const handleSave = () => {
    if (editingProduct && editValue) {
      const val = parseFloat(editValue);
      if (!isNaN(val)) {
        onOverride(editingProduct, val);
      }
    }
    setEditingProduct(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setEditValue('');
  };

  const toggleExpand = (productName: string) => {
    if (expandedRow === productName) {
      setExpandedRow(null);
    } else {
      setExpandedRow(productName);
    }
  };

  if (predictions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        No predictions generated yet. Run a prediction to see results.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Mobile Card View */}
      <div className="block md:hidden divide-y divide-slate-100">
        {predictions.map((p) => (
          <div key={p.productName} className="p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-slate-800 text-base">{p.productName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      p.confidence === 'High'
                        ? 'bg-green-100 text-green-800'
                        : p.confidence === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {p.confidence}
                  </span>
                  {p.fallbackUsed !== 'none' && p.fallbackUsed !== 'product-weekday' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800">
                      Fallback
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-xs text-slate-500 mb-1">Suggested Prep</div>
                {editingProduct === p.productName ? (
                  <div className="flex items-center justify-end space-x-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-16 px-2 py-1 border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-right text-sm"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleSave()} className="text-green-600 p-1 bg-green-50 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={handleCancel} className="text-red-500 p-1 bg-red-50 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <span className={`font-bold text-xl ${p.isManualOverride ? 'text-orange-600' : 'text-slate-800'}`}>
                      {p.suggestedPrep}
                      {p.isManualOverride && '*'}
                    </span>
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-slate-400 hover:text-orange-500 p-2 -mr-2"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => toggleExpand(p.productName)}
              className="w-full flex items-center justify-center py-2 text-xs text-slate-500 hover:bg-slate-50 rounded mt-2 border border-slate-100"
            >
              {expandedRow === p.productName ? (
                <>Hide Details <ChevronUp size={14} className="ml-1" /></>
              ) : (
                <>Show Details <ChevronDown size={14} className="ml-1" /></>
              )}
            </button>

            {expandedRow === p.productName && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-y-3 gap-x-4 text-sm animate-in slide-in-from-top-2 duration-200">
                <div>
                  <div className="text-slate-500 text-xs">Predicted</div>
                  <div className="font-medium text-slate-700">{Math.round(p.predictedQuantity)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Buffer (+Adj)</div>
                  <div className="font-medium text-slate-700">+{p.bufferApplied}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Batch Unit</div>
                  <div className="font-medium text-slate-700">{p.batchUnit}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 text-xs">Explanation</div>
                  <div className="text-slate-700 text-xs mt-1">{p.explanation}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Predicted</th>
              <th className="px-4 py-3 text-right">Buffer (+Adj)</th>
              <th className="px-4 py-3 text-right">Batch Unit</th>
              <th className="px-4 py-3 text-right">Suggested Prep</th>
              <th className="px-4 py-3 text-center">Confidence</th>
              <th className="px-4 py-3 text-center">Fallback</th>
              <th className="px-4 py-3">Explanation</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {predictions.map((p) => (
              <tr key={p.productName} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{p.productName}</td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {Math.round(p.predictedQuantity)}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  +{p.bufferApplied}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  {p.batchUnit}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingProduct === p.productName ? (
                    <div className="flex items-center justify-end space-x-2">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 px-2 py-1 border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-right"
                        autoFocus
                      />
                      <button onClick={() => handleSave()} className="text-green-600 hover:text-green-700">
                        <Check size={16} />
                      </button>
                      <button onClick={handleCancel} className="text-red-500 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className={`font-bold text-lg ${p.isManualOverride ? 'text-orange-600' : 'text-slate-800'}`}>
                      {p.suggestedPrep}
                      {p.isManualOverride && '*'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      p.confidence === 'High'
                        ? 'bg-green-100 text-green-800'
                        : p.confidence === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {p.confidence}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {p.fallbackUsed !== 'none' && p.fallbackUsed !== 'product-weekday' && (
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800" title={p.fallbackUsed}>
                       Fallback
                     </span>
                  )}
                  {p.fallbackUsed === 'product-weekday' && <span className="text-slate-400">-</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate" title={p.explanation}>
                  {p.explanation}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-slate-400 hover:text-orange-500 transition-colors"
                    title="Edit Prep Quantity"
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
