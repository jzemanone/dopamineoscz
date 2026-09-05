import React from 'react';
import { Moon, CheckCircle2, Link2, Sparkles, X, Heart, ShieldCheck, ArrowRight, UserCheck, DollarSign } from 'lucide-react';
import { Task, OpenLoop, UserStats, SpendingPause } from '../types';

interface EveningRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseDay?: () => void;
  completedTasksCountToday: number;
  openLoops: OpenLoop[];
  stats: UserStats;
  spendingPauses?: SpendingPause[];
  pausedSpendingToday?: number;
  onPlayClick?: () => void;
}

export const EveningRecapModal: React.FC<EveningRecapModalProps> = ({
  isOpen,
  onClose,
  onCloseDay,
  completedTasksCountToday,
  openLoops,
  stats,
  spendingPauses = [],
  pausedSpendingToday,
  onPlayClick,
}) => {
  if (!isOpen) return null;

  const activeLoops = openLoops.filter((l) => l.status === 'open');
  const criticalLoops = activeLoops.filter((l) => l.dueDate || l.softUrgency === 'today' || l.softUrgency === 'tomorrow');

  // Calculate paused spending resolved as 'skipped' today if not directly provided
  const calculatedPausedSpendingToday = typeof pausedSpendingToday === 'number'
    ? pausedSpendingToday
    : (() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return spendingPauses
          .filter((p) => {
            if (p.outcome !== 'skipped' || !p.resolvedAt) return false;
            return new Date(p.resolvedAt).toISOString().split('T')[0] === todayStr;
          })
          .reduce((sum, p) => sum + (p.cost || 0), 0);
      })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 overflow-hidden ring-1 ring-white/10">
        {/* Subtle Ambient Night Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                Večerní shrnutí
              </span>
              <h3 className="text-base font-black text-slate-100">
                Klid v hlavě & kontinuita
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              if (onPlayClick) onPlayClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Key Metrics */}
        <div className={`grid ${calculatedPausedSpendingToday > 0 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-3`}>
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Dnes dokončeno
            </span>
            <div className="text-xl font-black text-slate-100">
              {completedTasksCountToday} <span className="text-xs text-slate-400 font-normal">kroků</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              Otevřené smyčky
            </span>
            <div className="text-xl font-black text-slate-100">
              {activeLoops.length} <span className="text-xs text-slate-400 font-normal">závazků</span>
            </div>
          </div>

          {/* Paused Spending Today Metric (Shown only if > 0) */}
          {calculatedPausedSpendingToday > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Pozastavené útraty
              </span>
              <div className="text-xl font-black text-emerald-300">
                ${calculatedPausedSpendingToday.toFixed(0)} <span className="text-xs text-slate-400 font-normal">ušetřeno</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Open Loops List (Continuity Safety Net) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Hlídané závazky na pozadí:</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              {activeLoops.length} aktivních
            </span>
          </div>

          {activeLoops.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Žádné otevřené smyčky. Hlava je úplně čistá!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {activeLoops.slice(0, 4).map((loop) => (
                <div
                  key={loop.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">
                      {loop.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {loop.person && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                        {loop.person}
                      </span>
                    )}
                    {loop.dueDate && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        {loop.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reassurance Callout */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Dopamine OS bezpečně hlídá tvou kontinuitu i zítřejší termíny. V hlavě si nemusíš držet vůbec nic — pro dnešek můžeš v klidu vypnout.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            if (onPlayClick) onPlayClick();
            if (onCloseDay) {
              onCloseDay();
            } else {
              onClose();
            }
          }}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-98"
        >
          Uzavřít den a vypnout hlavu
        </button>
      </div>
    </div>
  );
};
