
import React, { useState } from 'react';
import { X, Package, Save } from 'lucide-react';

interface BatchUnitEditorProps {
  products: string[];
  mapping: Record<string, number>;
  onSave: (newMapping: Record<string, number>) => void;
}

export const BatchUnitEditor: React.FC<BatchUnitEditorProps> = ({ products, mapping, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localMapping, setLocalMapping] = useState<Record<string, number>>(mapping);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpen = () => {
    setLocalMapping({ ...mapping });
    setIsOpen(true);
  };

  const handleSave = () => {
    onSave(localMapping);
    setIsOpen(false);
  };

  const handleChange = (product: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setLocalMapping(prev => ({ ...prev, [product]: num }));
    } else if (val === '') {
      const newMap = { ...localMapping };
      delete newMap[product];
      setLocalMapping(newMap);
    }
  };

  const filteredProducts = products.filter(p => 
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return (
      <button 
        onClick={handleOpen}
        className="text-sm text-slate-500 hover:text-slate-700 underline flex items-center gap-1"
      >
        <Package className="w-4 h-4" />
        Manage Batch Units
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Batch Unit Configuration</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div key={product} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-700 truncate mr-2" title={product}>
                  {product}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Unit:</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={localMapping[product] || ''}
                    placeholder="1"
                    onChange={(e) => handleChange(product, e.target.value)}
                    className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
