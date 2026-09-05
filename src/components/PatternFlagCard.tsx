import React, { useState } from 'react';
import { AlertCircle, Sparkles, Trash2, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { Task } from '../types';
import { decomposeUltraSimple } from '../services/decomposer';

interface PatternFlagCardProps {
  task: Task;
  onShrinkSteps: (taskId: string, newMicroSteps: string[]) => void;
  onDropTask: (taskId: string) => void;
  onPlayClick?: () => void;
}

export const PatternFlagCard: React.FC<PatternFlagCardProps> = ({
  task,
  onShrinkSteps,
  onDropTask,
  onPlayClick,
}) => {
  const [isShrinking, setIsShrinking] = useState(false);
  const parkedTimes = task.parkedCount || 3;

  const handleShrink = async () => {
    if (onPlayClick) onPlayClick();
    setIsShrinking(true);
    try {
      const res = await decomposeUltraSimple(task.title);
      if (res.steps && res.steps.length > 0) {
        onShrinkSteps(task.id, res.steps);
      }
    } finally {
      setIsShrinking(false);
    }
  };

  const handleDrop = () => {
    if (onPlayClick) onPlayClick();
    onDropTask(task.id);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 animate-fadeIn">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Flag */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
            Detekován vzorec vyhýbání se ({parkedTimes}× odloženo)
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-slate-200 truncate">
            {task.title}
          </h4>
        </div>
      </div>

      {/* Compassionate message */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
        Tenhle úkol jsi odložil/a už <strong className="text-amber-300 font-bold">{parkedTimes}×</strong>. U ADHD mozku to skoro vždy značí skryté tření nebo moc velký krok. Zmenšíme ho na 30sekundový mikro-krok, nebo ho bez výčitek smažeme?
      </p>

      {/* Two Clear Choices */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={handleShrink}
          disabled={isShrinking}
          className="py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
        >
          {isShrinking ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Zmenšuji...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Zmenšit krok</span>
            </>
          )}
        </button>

        <button
          onClick={handleDrop}
          className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Zahodit (bez výčitek)</span>
        </button>
      </div>
    </div>
  );
};
