
import React, { useState } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ClosedDayManagerProps {
  closedDays: Set<string>;
  onToggleClosedDay: (date: string) => void;
}

export const ClosedDayManager: React.FC<ClosedDayManagerProps> = ({ closedDays, onToggleClosedDay }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputDate, setInputDate] = useState('');

  const sortedDays = Array.from(closedDays).sort().reverse();

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm text-slate-500 hover:text-slate-700 underline flex items-center gap-1"
      >
        <Calendar className="w-4 h-4" />
        Manage Closed Days ({closedDays.size})
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Manage Closed Days</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-600 mb-3">
            These dates are excluded from historical calculations.
            System auto-detects days with low revenue/orders.
          </p>
          <div className="flex gap-2">
            <input 
              type="date" 
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <button 
              onClick={() => {
                if (inputDate) {
                  onToggleClosedDay(inputDate);
                  setInputDate('');
                }
              }}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
            >
              Add/Toggle
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {sortedDays.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No closed days detected yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedDays.map((date: string) => (
                <div key={date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {format(parseISO(date), 'EEE, MMM d, yyyy')}
                    </span>
                  </div>
                  <button 
                    onClick={() => onToggleClosedDay(date)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
