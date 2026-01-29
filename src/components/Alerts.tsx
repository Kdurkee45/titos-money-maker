'use client';

import type { Alert } from '@/types/poker';

interface AlertsProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

const alertStyles: Record<string, string> = {
  info: 'bg-blue-900/50 border-blue-500 text-blue-200',
  warning: 'bg-yellow-900/50 border-yellow-500 text-yellow-200',
  danger: 'bg-red-900/50 border-red-500 text-red-200',
  success: 'bg-green-900/50 border-green-500 text-green-200',
};

const alertIcons: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  danger: '🚨',
  success: '✅',
};

export function Alerts({ alerts, onDismiss }: AlertsProps) {
  const activeAlerts = alerts.filter(a => !a.dismissed);
  
  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border animate-slide-in ${alertStyles[alert.type]}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{alertIcons[alert.type]}</span>
            <div className="flex-1">
              <div className="font-semibold">{alert.title}</div>
              <div className="text-sm opacity-80">{alert.message}</div>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Pre-built alerts for common situations
export const ALERTS = {
  tiltWarning: {
    type: 'warning' as const,
    title: 'Tilt Detection',
    message: 'You\'ve lost 3 hands in a row. Consider taking a break or tightening your range.',
  },
  premiumHand: {
    type: 'success' as const,
    title: 'Premium Hand',
    message: 'You have a top 5% starting hand. Consider raising for value.',
  },
  unusualBehavior: {
    type: 'info' as const,
    title: 'Unusual Opponent Behavior',
    message: 'BigStack_Dan just made an atypical large bet. This deviates from their normal pattern.',
  },
  dangerBoard: {
    type: 'danger' as const,
    title: 'Dangerous Board',
    message: 'Multiple draws complete on this card. Proceed with caution.',
  },
};
