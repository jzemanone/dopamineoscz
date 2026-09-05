import React from 'react';
import { Flame, Sparkles, Shield, Pause, Sprout } from 'lucide-react';
import { UserStats } from '../types';

interface XpBadgeProps {
  stats: UserStats;
  isDayClosed?: boolean;
  onOpenMorningLaunchpad: () => void;
  onOpenStats: () => void;
  recentXpGain?: { amount: number; reason: string } | null;
}

export const XpBadge: React.FC<XpBadgeProps> = ({
  stats,
  isDayClosed = false,
  onOpenMorningLaunchpad,
  onOpenStats,
  recentXpGain,
}) => {
  const streakStatus = stats.streakStatus || 'active';

  // Compassionate, non-shaming streak pill based on ADHD forgiveness rules
  const renderStreakPill = () => {
    if (isDayClosed || streakStatus === 'new_start' || stats.streak === 0) {
      return (
        <button
          onClick={onOpenMorningLaunchpad}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black hover:bg-emerald-500/30 transition-all active:scale-95 shadow-sm"
          title="Otevřít Ranní start"
        >
          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nový den</span>
        </button>
      );
    }

    if (streakStatus === 'frozen') {
      return (
        <button
          onClick={onOpenStats}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold hover:bg-indigo-500/25 transition-all active:scale-95 shadow-sm"
          title={`Zmrazení zachránilo tvůj ${stats.streak}denní streak! Klikni pro statistiky.`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-extrabold">{stats.streak}d (Zmrazeno)</span>
        </button>
      );
    }

    if (streakStatus === 'paused') {
      return (
        <button
          onClick={onOpenStats}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-500/25 transition-all active:scale-95 shadow-sm"
          title="1 den odpočinku bez ztráty postupu. Klikni pro statistiky."
        >
          <Pause className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-extrabold">{stats.streak}d (Pauza)</span>
        </button>
      );
    }

    return (
      <button
        onClick={onOpenStats}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all active:scale-95 shadow-sm shadow-amber-500/10"
        title={`Streak: ${stats.streak} aktivních dní v řadě. Klikni pro statistiky a trofeje.`}
      >
        <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span className="font-extrabold">{stats.streak}d streak</span>
      </button>
    );
  };

  return (
    <div className="relative flex items-center gap-1.5 sm:gap-2">
      {/* 1. Forgiving Streak Pill */}
      {renderStreakPill()}

      {/* 2. ✨ Level {lvl} ({xp} XP) */}
      <button
        onClick={onOpenStats}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 border border-indigo-500/40 text-xs font-black text-slate-100 hover:border-indigo-400 hover:bg-slate-850 transition-all active:scale-95 shadow-md shadow-indigo-500/15 shrink-0"
        title={`Level ${stats.level} (${stats.xp} celkem XP) · Klikni pro statistiky a trofeje`}
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/25 text-indigo-300 text-[10px] font-black">
          ★
        </span>
        <span className="text-amber-400 font-black tracking-tight">Lvl {stats.level}</span>
        <span className="h-3 w-[1px] bg-slate-700 mx-0.5" />
        <span className="text-[11px] text-slate-300 font-mono font-bold">{stats.xp} XP</span>
      </button>

      {/* Real-time Floating XP Gain Toast */}
      {recentXpGain && (
        <div className="absolute -bottom-8 right-0 z-40 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-500/25 flex items-center gap-1 animate-bounce">
          <Sparkles className="w-3 h-3 text-slate-950" />
          <span>+{recentXpGain.amount} XP</span>
        </div>
      )}
    </div>
  );
};
