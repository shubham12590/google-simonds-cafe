import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface InsightsPanelProps {
  insights: string[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-indigo-600" size={20} />
        <h3 className="text-lg font-semibold text-indigo-900">AI-Generated Insights</h3>
      </div>
      <ul className="space-y-3">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-indigo-800 leading-relaxed">
            <div className="mt-1 flex-shrink-0">
              {insight.includes('increased') || insight.includes('Growth') ? (
                <TrendingUp size={16} className="text-emerald-600" />
              ) : insight.includes('decreased') || insight.includes('decline') ? (
                <TrendingDown size={16} className="text-red-600" />
              ) : (
                <AlertCircle size={16} className="text-indigo-500" />
              )}
            </div>
            <span>{insight}</span>
          </li>
        ))}
        {insights.length === 0 && (
          <p className="text-sm text-indigo-400 italic">Not enough data to generate insights.</p>
        )}
      </ul>
    </div>
  );
};
