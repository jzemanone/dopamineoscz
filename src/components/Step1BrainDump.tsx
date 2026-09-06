import React, { useState } from 'react';
import { Plus, Sparkles, FileText, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, EnergyLevel, TaskCategory, PRESET_TASKS } from '../types';

interface Step1BrainDumpProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onOpenBulkDump: () => void;
  onPlayClick: () => void;
}

export const Step1BrainDump: React.FC<Step1BrainDumpProps> = ({
  onAddTask,
  onOpenBulkDump,
  onPlayClick,
}) => {
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(2);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('low');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [showQuickPresets, setShowQuickPresets] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onPlayClick();

    // Estimate XP based on minutes
    let xpReward = 25;
    if (estimatedMinutes > 2 && estimatedMinutes <= 5) xpReward = 45;
    if (estimatedMinutes > 5 && estimatedMinutes <= 15) xpReward = 75;
    if (estimatedMinutes > 15) xpReward = 100;

    onAddTask({
      title: title.trim(),
      estimatedMinutes,
      energyLevel,
      category,
      xpReward,
    });

    setTitle('');
  };

  const handleSelectPreset = (preset: typeof PRESET_TASKS[0]) => {
    onPlayClick();
    onAddTask({
      ...preset,
    });
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl shadow-slate-950/50 backdrop-blur-sm">
      {/* Step Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
            1
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Rychlý zápis / Brain Dump
          </h2>
        </div>

        <button
          onClick={() => {
            onPlayClick();
            onOpenBulkDump();
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-all"
        >
          <FileText className="w-3 h-3" />
          <span>Hromadný zápis</span>
        </button>
      </div>

      {/* Main Fast Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Co je potřeba udělat? (Stručně a jasně)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-20 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:hover:brightness-100 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Přidat</span>
          </button>
        </div>

        {/* Quick Options Bar (Duration & Energy selector) */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          {/* Estimated Minutes Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Čas:</span>
            {[2, 5, 15, 25].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  onPlayClick();
                  setEstimatedMinutes(mins);
                  if (mins <= 2) setEnergyLevel('low');
                  else if (mins <= 10) setEnergyLevel('medium');
                  else setEnergyLevel('high');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  estimatedMinutes === mins
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {mins === 2 ? '⚡ 2 min' : `${mins}m`}
              </button>
            ))}
          </div>

          {/* Quick Preset Toggle Button */}
          <button
            type="button"
            onClick={() => {
              onPlayClick();
              setShowQuickPresets(!showQuickPresets);
            }}
            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 flex-shrink-0"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Předlohy</span>
            {showQuickPresets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Quick Win Presets */}
        {showQuickPresets && (
          <div className="pt-2 border-t border-slate-800/80 animate-fadeIn">
            <p className="text-[10px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Okamžité 2minutové startéry:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(PRESET_TASKS || []).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80 hover:border-amber-500/40 transition-all flex items-center gap-1.5"
                >
                  <span className="text-amber-400 font-bold">+{preset?.xpReward || 25}XP</span>
                  <span className="truncate max-w-[180px]">{preset?.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </section>
  );
};
