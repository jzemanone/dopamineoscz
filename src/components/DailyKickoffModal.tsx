import React, { useState } from 'react';
import {
  Zap,
  BatteryCharging,
  Flame,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ListTodo,
  Compass,
  X,
} from 'lucide-react';
import { EnergyLevel, Task } from '../types';
import { getLocalHeuristicDecomposition } from '../services/decomposer';

interface DailyKickoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteKickoff: (data: {
    capacity: EnergyLevel;
    primaryTaskTitle: string;
    subtaskTitles: string[];
    backgroundThoughts: string[];
  }) => void;
  onPlayClick: () => void;
  currentStreak: number;
}

export const DailyKickoffModal: React.FC<DailyKickoffModalProps> = ({
  isOpen,
  onClose,
  onCompleteKickoff,
  onPlayClick,
  currentStreak,
}) => {
  const [selectedBattery, setSelectedBattery] = useState<EnergyLevel>('low');
  const [primaryTask, setPrimaryTask] = useState<string>('');
  const [backgroundNotes, setBackgroundNotes] = useState<string>('');
  const [showOptionalDump, setShowOptionalDump] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickTaskSuggestions = [
    { label: 'Vyprat prádlo & uklidit pokoj', energy: 'low' as EnergyLevel },
    { label: 'Odpovědět na hořící e-mail / zprávu', energy: 'medium' as EnergyLevel },
    { label: 'Dát si rychlé jídlo & napít se', energy: 'low' as EnergyLevel },
    { label: 'Soustředit se na hlavní pracovní úkol', energy: 'high' as EnergyLevel },
  ];

  const handleSelectSuggestion = (suggestion: { label: string; energy: EnergyLevel }) => {
    onPlayClick();
    setPrimaryTask(suggestion.label);
    setSelectedBattery(suggestion.energy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = primaryTask.trim() || 'Hlavní cíl pro dnešek';

    // Auto decompose using semantic classifier
    const { steps } = getLocalHeuristicDecomposition(title, selectedBattery === 'low' ? 'low_energy' : selectedBattery === 'medium' ? 'field' : 'desk');

    // Parse background thoughts by newlines or bullets
    const rawThoughts = backgroundNotes
      .split('\n')
      .map((line) => line.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((line) => line.length > 0);

    onPlayClick();
    onCompleteKickoff({
      capacity: selectedBattery,
      primaryTaskTitle: title,
      subtaskTitles: steps,
      backgroundThoughts: rawThoughts,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kickoff-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-500/10 relative text-slate-100 my-auto">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close / Skip button */}
        <button
          onClick={() => {
            onPlayClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all"
          title="Zatím přeskočit"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Compass className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="kickoff-modal-title" className="text-base sm:text-lg font-black tracking-tight text-slate-100">
                Ranní start dne
              </h2>
              {currentStreak > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30 flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-amber-400 stroke-none" />
                  {currentStreak} dní Streak
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              ADHD denní kompas · Vypni šum v hlavě a rozjeď momentum
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* STEP 1: Biological Battery */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>1. Na kolik procent ti teď jede baterka?</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500">Bez výčitek</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Low */}
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  setSelectedBattery('low');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedBattery === 'low'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    selectedBattery === 'low' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current stroke-none" />
                </div>
                <div className="leading-none">
                  <p className="text-xs font-black">Nízká ⚡</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">2min jiskry</p>
                </div>
              </button>

              {/* Medium */}
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  setSelectedBattery('medium');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedBattery === 'medium'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    selectedBattery === 'medium' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800'
                  }`}
                >
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div className="leading-none">
                  <p className="text-xs font-black">Střední 🔋</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Vyvážené tempo</p>
                </div>
              </button>

              {/* High */}
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  setSelectedBattery('high');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedBattery === 'high'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    selectedBattery === 'high' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800'
                  }`}
                >
                  <Flame className="w-4 h-4 fill-current stroke-none" />
                </div>
                <div className="leading-none">
                  <p className="text-xs font-black">Vysoká 🔥</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Hluboký tah</p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: The ONE Battle */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-amber-400 block">
              2. Kdybys měl dnes vyhrát jen JEDNU jedinou bitvu, co to bude?
            </label>

            <input
              type="text"
              value={primaryTask}
              onChange={(e) => setPrimaryTask(e.target.value)}
              placeholder="např. Vyprat prádlo, Odeslat fakturu, Dopsat koncept..."
              className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-medium"
              autoFocus
            />

            {/* Quick Suggestions */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Rychlá nakopnutí na 1 klik:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTaskSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 transition-all text-left"
                  >
                    + {sug.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: Optional Brain Dump (Background Thoughts) */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                <span>3. Hlučí ti v hlavě další myšlenky? (Volitelné)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowOptionalDump(!showOptionalDump)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
              >
                {showOptionalDump ? 'Sbalit' : 'Vysypat myšlenky (+)'}
              </button>
            </div>

            {showOptionalDump && (
              <div className="animate-fadeIn space-y-1.5">
                <textarea
                  value={backgroundNotes}
                  onChange={(e) => setBackgroundNotes(e.target.value)}
                  placeholder="Jedna myšlenka na řádek (např. koupit krmení pro kočku, zavolat mámě, zkontrolovat účet)..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-medium resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-500">
                  Tyto myšlenky bezpečně zaparkujeme do Inboxu, aby tvůj mozek mohl vypnout.
                </p>
              </div>
            )}
          </div>

          {/* Big CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950 group-hover:rotate-12 transition-transform" />
              <span>ODSTARTOVAT DEN (+25 XP)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
