import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface FocusTimerProps {
  initialMinutes: number;
  onTimerComplete: (minutes: number) => void;
  onPlayClick: () => void;
  onTick: () => void;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onRunningChange?: (isRunning: boolean) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  initialMinutes,
  onTimerComplete,
  onPlayClick,
  onTick,
  soundEnabled,
  hapticEnabled,
  onRunningChange,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(initialMinutes || 2);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(
    Math.round((initialMinutes || 2) * 60)
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when initialMinutes changes from task
  useEffect(() => {
    const mins = initialMinutes > 0 ? initialMinutes : 2;
    setDurationMinutes(mins);
    setTimeLeftSec(Math.round(mins * 60));
    setIsRunning(false);
    setHasCompleted(false);
    onRunningChange?.(false);
  }, [initialMinutes]);

  // Interval timer tick
  useEffect(() => {
    if (isRunning) {
      onRunningChange?.(true);
      timerRef.current = setInterval(() => {
        setTimeLeftSec((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasCompleted(true);
            onRunningChange?.(false);
            soundManager.playTimerDone(soundEnabled);
            soundManager.triggerHaptic(hapticEnabled);
            onTimerComplete(durationMinutes);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          if (prev <= 6) {
            onTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      onRunningChange?.(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    isRunning,
    durationMinutes,
    onTimerComplete,
    onTick,
    soundEnabled,
    hapticEnabled,
    onRunningChange,
  ]);

  const toggleTimer = () => {
    onPlayClick();
    if (timeLeftSec === 0) {
      setTimeLeftSec(Math.round(durationMinutes * 60));
      setHasCompleted(false);
    }
    setIsRunning(!isRunning);
  };

  const handleSelectPreset = (mins: number) => {
    onPlayClick();
    setDurationMinutes(mins);
    setTimeLeftSec(Math.round(mins * 60));
    setIsRunning(false);
    setHasCompleted(false);
  };

  const handleReset = () => {
    onPlayClick();
    setIsRunning(false);
    setTimeLeftSec(Math.round(durationMinutes * 60));
    setHasCompleted(false);
  };

  const handleAddMinute = () => {
    onPlayClick();
    setTimeLeftSec((prev) => prev + 60);
    setDurationMinutes((prev) => Math.ceil((prev * 60 + 60) / 60));
  };

  // Calculations
  const totalSeconds = Math.max(1, Math.round(durationMinutes * 60));
  const progressPercent = Math.min(100, Math.max(0, (timeLeftSec / totalSeconds) * 100));
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  const mins = Math.floor(timeLeftSec / 60);
  const secs = timeLeftSec % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="flex flex-col items-center justify-center my-2 relative z-10">
      {/* Quick Presets Bar: 30s, 2m, 5m, 15m */}
      <div className="flex items-center gap-1.5 mb-3 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => handleSelectPreset(0.5)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            durationMinutes === 0.5
              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="30sekundová mikro-jiskra"
        >
          ⚡ 30s
        </button>
        {[2, 5, 15].map((preset) => (
          <button
            key={preset}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              durationMinutes === preset
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {preset === 2 ? '2 min' : `${preset} min`}
          </button>
        ))}
      </div>

      {/* Visual Countdown Ring with Flash effect on complete */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        {hasCompleted && (
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
        )}

        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-slate-800/90"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            className={`transition-all duration-300 ${
              hasCompleted
                ? 'stroke-emerald-400'
                : isRunning
                ? 'stroke-amber-400'
                : 'stroke-amber-500/60'
            }`}
            strokeWidth="6"
            strokeDasharray={283}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span
            className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
              hasCompleted ? 'text-emerald-400' : 'text-slate-100'
            }`}
          >
            {formattedTime}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            {hasCompleted ? 'Krok zvládnut!' : isRunning ? 'Soustředění' : 'Připraveno'}
          </span>
        </div>
      </div>

      {/* Primary Play/Pause and Action Row */}
      <div className="flex items-center gap-2.5 mt-3">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all active:scale-95 shadow-sm"
          title="Resetovat časovač"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg active:scale-95 ${
            isRunning
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 shadow-rose-500/10'
              : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110 shadow-amber-500/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-rose-300 stroke-none" />
              <span>Pauza</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950 stroke-none" />
              <span>{hasCompleted ? 'Znovu' : 'Spustit fokus'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleAddMinute}
          className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all active:scale-95 shadow-sm text-xs font-bold flex items-center"
          title="Přidat +1 minutu"
        >
          <Plus className="w-3.5 h-3.5 mr-0.5" />
          <span>1m</span>
        </button>
      </div>
    </div>
  );
};
