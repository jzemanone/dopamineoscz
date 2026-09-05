import React, { useState } from 'react';
import { Zap, BatteryCharging, Flame, Check, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { EnergyLevel, Task } from '../types';

interface Step2CapacitySelectorProps {
  currentCapacity: EnergyLevel;
  onSelectCapacity: (level: EnergyLevel) => void;
  tasks: Task[];
  onPlayClick: () => void;
  hasCheckedInToday?: boolean;
  onPerformCheckIn?: () => void;
}

export const Step2CapacitySelector: React.FC<Step2CapacitySelectorProps> = ({
  currentCapacity,
  onSelectCapacity,
  tasks,
  onPlayClick,
  hasCheckedInToday = false,
  onPerformCheckIn,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Count matching tasks per capacity level
  const counts = {
    low: pendingTasks.filter((t) => t.energyLevel === 'low' || t.estimatedMinutes <= 2).length,
    medium: pendingTasks.filter(
      (t) => t.energyLevel === 'medium' || (t.estimatedMinutes > 2 && t.estimatedMinutes <= 10)
    ).length,
    high: pendingTasks.filter((t) => t.energyLevel === 'high' || t.estimatedMinutes > 10).length,
  };

  const levels: {
    key: EnergyLevel;
    label: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    badgeColor: string;
  }[] = [
    {
      key: 'low',
      label: 'Nízká energie',
      sub: '2min mikro-kroky',
      icon: <Zap className="w-4 h-4 fill-emerald-400 stroke-none" />,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50 text-emerald-300',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      key: 'medium',
      label: 'Střední energie',
      sub: 'Tempo 5-10 min',
      icon: <BatteryCharging className="w-4 h-4 text-amber-400" />,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/50 text-amber-300',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      key: 'high',
      label: 'Vysoký fokus',
      sub: 'Hluboká práce',
      icon: <Flame className="w-4 h-4 fill-rose-500 stroke-none" />,
      color: 'from-rose-500/20 to-rose-600/10 border-rose-500/50 text-rose-300',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
  ];

  const currentLevelObj = levels.find((l) => l.key === currentCapacity) || levels[0];
  const matchingCount = counts[currentCapacity];

  const formatTaskCount = (cnt: number) => {
    if (cnt === 1) return '1 úkol';
    if (cnt >= 2 && cnt <= 4) return `${cnt} úkoly`;
    return `${cnt} úkolů`;
  };

  // Collapsed Minimal Status Pill View (Focus First)
  if (!isExpanded) {
    return (
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-sm transition-all animate-fadeIn">
        <div className="flex items-center justify-between gap-2">
          {/* Status info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
              {currentLevelObj.icon}
            </div>
            <div className="flex items-center gap-1.5 truncate text-xs">
              <span className="font-bold text-slate-100">Režim: {currentLevelObj.label}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 text-[11px] truncate">
                připraveno {formatTaskCount(matchingCount)}
              </span>
            </div>
          </div>

          {/* Right Action controls */}
          <div className="flex items-center gap-2 shrink-0">
            {onPerformCheckIn && !hasCheckedInToday && (
              <button
                onClick={onPerformCheckIn}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse transition-all"
                title="Zapsat denní energii"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>+15 XP</span>
              </button>
            )}

            <button
              onClick={() => {
                onPlayClick();
                setIsExpanded(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
            >
              <span>Změnit</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded View
  return (
    <section className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl shadow-slate-950/50 backdrop-blur-sm animate-fadeIn">
      {/* Step Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
            ⚡
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Úroveň energie
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onPerformCheckIn && (
            <button
              onClick={onPerformCheckIn}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                hasCheckedInToday
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
              }`}
            >
              {hasCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Zapsáno</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Zapsat (+15 XP)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              onPlayClick();
              setIsExpanded(false);
            }}
            className="text-slate-400 hover:text-slate-200 text-xs font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Sbalit výběr energie"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Way Energy Level Cards */}
      <div className="grid grid-cols-3 gap-2">
        {levels.map((lvl) => {
          const isSelected = currentCapacity === lvl.key;
          const count = counts[lvl.key];

          return (
            <button
              key={lvl.key}
              type="button"
              onClick={() => {
                onPlayClick();
                onSelectCapacity(lvl.key);
                setIsExpanded(false); // Auto-collapse to return focus to One-Task card
              }}
              className={`relative flex flex-col items-center text-center p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${
                isSelected
                  ? `bg-gradient-to-b ${lvl.color} shadow-lg ring-1 ring-amber-500/30`
                  : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {/* Selected Checkmark Badge */}
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}

              <div className="mb-1">{lvl.icon}</div>
              <span className="text-xs font-bold leading-tight mb-0.5">{lvl.label}</span>
              <span className="text-[10px] text-slate-400 leading-tight mb-2">{lvl.sub}</span>

              {/* Matching Count Badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${lvl.badgeColor}`}
              >
                {formatTaskCount(count)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
