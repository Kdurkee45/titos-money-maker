'use client';

import type { Card, Suit } from '@/types/poker';

interface PokerCardProps {
  card?: Card | null;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
}

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-blue-500',
  clubs: 'text-green-500',
  spades: 'text-white',
};

const sizes = {
  sm: 'w-10 h-14 text-sm',
  md: 'w-14 h-20 text-lg',
  lg: 'w-16 h-24 text-xl',
};

export function PokerCard({ card, size = 'md', hidden = false }: PokerCardProps) {
  if (hidden || !card) {
    return (
      <div className={`${sizes[size]} rounded-lg bg-gradient-to-br from-blue-900 to-blue-950 border-2 border-blue-600 flex items-center justify-center shadow-lg`}>
        <span className="text-blue-400 text-2xl font-bold">?</span>
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} rounded-lg bg-gradient-to-br from-white to-gray-100 flex flex-col items-center justify-center shadow-lg font-bold ${suitColors[card.suit]}`}>
      <span>{card.rank}</span>
      <span className="text-lg">{suitSymbols[card.suit]}</span>
    </div>
  );
}

interface CardGroupProps {
  cards: (Card | null)[];
  size?: 'sm' | 'md' | 'lg';
  showHidden?: boolean;
}

export function CardGroup({ cards, size = 'md', showHidden = false }: CardGroupProps) {
  return (
    <div className="flex gap-2">
      {cards.map((card, i) => (
        <PokerCard key={i} card={card} size={size} hidden={showHidden && !card} />
      ))}
    </div>
  );
}
