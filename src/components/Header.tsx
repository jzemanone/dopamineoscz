import React from 'react';
import { Moon } from 'lucide-react';
import { UserStats } from '../types';
import { XpBadge } from './XpBadge';
import { Logo } from './Logo';

interface HeaderProps {
  stats: UserStats;
  isDayClosed?: boolean;
  onOpenMorningLaunchpad: () => void;
  onOpenStats: () => void;
  onOpenEveningRecap?: () => void;
  recentXpGain?: { amount: number; reason: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isDayClosed = false,
  onOpenMorningLaunchpad,
  onOpenStats,
  onOpenEveningRecap,
  recentXpGain,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#080C14]/95 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2.5 shadow-lg shadow-black/40">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Official Dopamine OS Neon Brain Logo */}
        <button
          onClick={onOpenMorningLaunchpad}
          className="flex items-center gap-2 shrink-0 text-left hover:opacity-90 transition-opacity focus:outline-none"
          title="Otevřít Ranní start"
        >
          <Logo variant="full" size="sm" />
        </button>

        {/* Status Indicators: Streak/New Day, Evening Recap & XP/Level Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isDayClosed && onOpenEveningRecap && (
            <button
              onClick={onOpenEveningRecap}
              className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all active:scale-95"
              title="Večerní rekapitulace & Uzavřít den"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          )}

          <XpBadge
            stats={stats}
            isDayClosed={isDayClosed}
            onOpenMorningLaunchpad={onOpenMorningLaunchpad}
            onOpenStats={onOpenStats}
            recentXpGain={recentXpGain}
          />
        </div>
      </div>
    </header>
  );
};
