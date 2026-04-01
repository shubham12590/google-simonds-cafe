
import React from 'react';
import { IngredientRequirement } from '../utils/prediction/types';
import { Download } from 'lucide-react';

interface IngredientRequirementsPanelProps {
  ingredients: IngredientRequirement[];
}

export const IngredientRequirementsPanel: React.FC<IngredientRequirementsPanelProps> = ({ ingredients }) => {
  const handleExport = () => {
    if (ingredients.length === 0) return;

    const csvContent = [
      ['Ingredient', 'Need', 'Unit', 'In Stock', 'To Order', 'Supplier'],
      ...ingredients.map(i => [
        i.ingredient,
        i.need,
        i.unit,
        i.inStock || 0,
        i.toOrder,
        i.supplier || ''
      ])
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ingredient_requirements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (ingredients.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center text-slate-500">
        <p>No ingredient requirements calculated yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Ingredient Requirements</h3>
        <button
          onClick={handleExport}
          className="text-slate-500 hover:text-orange-600 transition-colors"
          title="Export CSV"
        >
          <Download size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-0">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0">
            <tr>
              <th className="px-4 py-2">Ingredient</th>
              <th className="px-4 py-2 text-right">Need</th>
              <th className="px-4 py-2 text-right">To Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ingredients.map((ing) => (
              <tr key={ing.ingredient} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-700">{ing.ingredient}</td>
                <td className="px-4 py-2 text-right text-slate-600">
                  {ing.need} <span className="text-xs text-slate-400">{ing.unit}</span>
                </td>
                <td className="px-4 py-2 text-right font-semibold text-orange-600">
                  {ing.toOrder > 0 ? ing.toOrder : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
