'use client';

import type { EquityResult, PotOdds } from '@/types/poker';

interface EquityDisplayProps {
  equity: EquityResult;
  potOdds?: PotOdds | null;
}

export function EquityDisplay({ equity, potOdds }: EquityDisplayProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
        Equity Analysis
      </h3>
      
      {/* Win/Tie/Lose Bar */}
      <div className="mb-4">
        <div className="equity-meter">
          <div 
            className="equity-win flex items-center justify-center text-xs font-bold"
            style={{ width: `${equity.win}%` }}
          >
            {equity.win > 10 && `${equity.win.toFixed(1)}%`}
          </div>
          <div 
            className="equity-tie flex items-center justify-center text-xs font-bold"
            style={{ width: `${equity.tie}%` }}
          />
          <div 
            className="equity-lose flex items-center justify-center text-xs font-bold"
            style={{ width: `${equity.lose}%` }}
          >
            {equity.lose > 10 && `${equity.lose.toFixed(1)}%`}
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-400">
          <span className="text-green-500">Win: {equity.win.toFixed(1)}%</span>
          <span className="text-yellow-500">Tie: {equity.tie.toFixed(1)}%</span>
          <span className="text-red-500">Lose: {equity.lose.toFixed(1)}%</span>
        </div>
      </div>

      {/* Monte Carlo info */}
      <div className="text-xs text-gray-500 mb-4">
        Based on {equity.samples.toLocaleString()} simulations
      </div>

      {/* Pot Odds Analysis */}
      {potOdds && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Pot Odds</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Pot Size:</span>
              <span className="ml-2 font-semibold">${potOdds.potSize}</span>
            </div>
            <div>
              <span className="text-gray-500">To Call:</span>
              <span className="ml-2 font-semibold">${potOdds.toCall}</span>
            </div>
            <div>
              <span className="text-gray-500">Pot Odds:</span>
              <span className="ml-2 font-semibold">{potOdds.odds.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Implied:</span>
              <span className="ml-2 font-semibold">{potOdds.impliedOdds.toFixed(1)}%</span>
            </div>
          </div>

          {/* Decision */}
          <div className={`mt-4 p-3 rounded-lg ${potOdds.isGoodCall ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${potOdds.isGoodCall ? 'text-green-500' : 'text-red-500'}`}>
                {potOdds.isGoodCall ? '✓' : '✗'}
              </span>
              <div>
                <div className={`font-semibold ${potOdds.isGoodCall ? 'text-green-400' : 'text-red-400'}`}>
                  {potOdds.isGoodCall ? 'Profitable Call' : 'Unprofitable Call'}
                </div>
                <div className="text-xs text-gray-400">
                  Need {potOdds.requiredEquity.toFixed(1)}% equity, you have {equity.win.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
