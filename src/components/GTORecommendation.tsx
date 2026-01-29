'use client';

import type { GTORecommendation as GTORecType } from '@/types/poker';

interface GTORecommendationProps {
  recommendation: GTORecType;
}

const actionColors: Record<string, string> = {
  fold: 'bg-gray-600',
  check: 'bg-blue-600',
  call: 'bg-green-600',
  bet: 'bg-yellow-600',
  raise: 'bg-yellow-500',
  'all-in': 'bg-red-600',
};

const actionLabels: Record<string, string> = {
  fold: 'FOLD',
  check: 'CHECK',
  call: 'CALL',
  bet: 'BET',
  raise: 'RAISE',
  'all-in': 'ALL-IN',
};

export function GTORecommendation({ recommendation }: GTORecommendationProps) {
  const primaryAction = recommendation.actions.find(a => a.isPrimary);
  
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
        GTO Recommendation
      </h3>

      {/* Situation */}
      <div className="text-sm text-gray-300 mb-4 p-2 bg-gray-800/50 rounded">
        {recommendation.situation}
      </div>

      {/* Primary Action */}
      {primaryAction && (
        <div className="mb-4 p-4 recommendation-optimal">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 font-semibold">Optimal Play</span>
            <span className="text-green-400 text-sm">EV: +{primaryAction.ev.toFixed(1)} BB</span>
          </div>
          <div className="flex items-center gap-3">
            <button className={`action-btn ${primaryAction.action === 'raise' ? 'action-raise' : primaryAction.action === 'call' ? 'action-call' : primaryAction.action === 'fold' ? 'action-fold' : 'action-check'}`}>
              {actionLabels[primaryAction.action || 'check']}
              {primaryAction.sizing && ` $${primaryAction.sizing}`}
            </button>
            <span className="text-sm text-gray-400">
              Frequency: {primaryAction.frequency}%
            </span>
          </div>
        </div>
      )}

      {/* Action Frequencies */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">Mixed Strategy</h4>
        <div className="space-y-2">
          {recommendation.actions.map((action, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-16 text-xs font-semibold">
                {actionLabels[action.action || 'check']}
              </div>
              <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
                <div 
                  className={`h-full ${actionColors[action.action || 'check']} transition-all`}
                  style={{ width: `${action.frequency}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs text-gray-400">
                {action.frequency}%
              </div>
              <div className="w-16 text-right text-xs text-gray-500">
                {action.ev >= 0 ? '+' : ''}{action.ev.toFixed(1)} BB
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">Analysis</h4>
        <p className="text-sm text-gray-300">{recommendation.explanation}</p>
      </div>

      {/* Exploitative Adjustment */}
      {recommendation.exploitativeAdjustment && (
        <div className="mt-4 p-3 bg-purple-900/20 border border-purple-700/30 rounded">
          <h4 className="text-xs font-semibold text-purple-400 mb-1">
            🎯 Exploitative Adjustment
          </h4>
          <p className="text-sm text-purple-200">{recommendation.exploitativeAdjustment}</p>
        </div>
      )}
    </div>
  );
}
