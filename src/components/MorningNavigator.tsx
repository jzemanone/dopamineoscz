import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  Zap,
  Briefcase,
  BatteryCharging,
  Layers,
  CheckCircle2,
  Check,
  X,
  Flame,
  Bot,
  RefreshCw,
  Link2,
  User,
  Calendar,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { EnergyLevel, OpenLoop } from '../types';
import { decomposeWithAI, DecomposeMode, DecomposedResult } from '../services/decomposer';
import { autoTriageRawInput, detectLoopMetadata } from '../utils/triage';
import { formatDueDateTime } from '../utils/dateTime';
import { trackMorningLaunchpadCompleted } from '../lib/analytics';

interface MorningNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  openLoops?: OpenLoop[];
  onAddOpenLoops?: (loops: Array<{ title: string; person?: string; dueDate?: string; softUrgency?: any }>) => void;
  onCompleteOpenLoop?: (loopId: string) => void;
  onLaunchFlow: (data: {
    mode: DecomposeMode;
    capacity: EnergyLevel;
    primaryTask: string;
    steps: string[];
    warmUpTask?: string;
    orbitalStash: string[];
    category: 'communication' | 'chore' | 'deep_work' | 'fuel' | 'physical' | 'digital' | 'admin';
    source: 'gemini' | 'heuristic_fallback';
  }) => void;
  onPlayClick: () => void;
  currentStreak: number;
}

export const MorningNavigator: React.FC<MorningNavigatorProps> = ({
  isOpen,
  onClose,
  openLoops = [],
  onAddOpenLoops,
  onCompleteOpenLoop,
  onLaunchFlow,
  onPlayClick,
  currentStreak,
}) => {
  const [mode, setMode] = useState<DecomposeMode>('BALANCED_FLOW');
  const [rawDump, setRawDump] = useState<string>('');
  const [primaryTask, setPrimaryTask] = useState<string>('');
  const [orbitalStash, setOrbitalStash] = useState<string[]>([]);
  const [decomposed, setDecomposed] = useState<DecomposedResult | null>(null);
  const [isDecomposing, setIsDecomposing] = useState<boolean>(false);
  const [stepView, setStepView] = useState<'input' | 'synthesis'>('input');
  const [warmUpTask, setWarmUpTask] = useState<string>('');
  const [detectedLoops, setDetectedLoops] = useState<Array<{ title: string; person?: string; dueDate?: string }>>([]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [completedStepIndices, setCompletedStepIndices] = useState<number[]>([]);
  const [recentCelebrationIndex, setRecentCelebrationIndex] = useState<number | null>(null);

  const activeLoops = openLoops.filter((l) => l.status === 'open');

  // Quick preset templates for busy mornings
  const presets = [
    { label: 'Práce a pochůzky', text: 'Posilovna, poslat nabídku Petrovi do zítřka, vyřídit týmové zprávy' },
    { label: 'Hluboká práce', text: 'Opravit bug v přihlašování, otestovat platby, zavolat mámě o víkendu' },
    { label: 'Úklid a restart', text: 'Uklidit pracovní stůl, vyprat prádlo, připravit rychlý oběd, nakoupit' },
  ];

  if (!isOpen) return null;

  // 3 Biological Capacity States (Friction Filters)
  const modeConfigs: Record<
    'LOW_BATTERY' | 'BALANCED_FLOW' | 'PEAK_PERFORMANCE',
    { label: string; sub: string; icon: React.ReactNode; capacity: EnergyLevel; color: string }
  > = {
    LOW_BATTERY: {
      label: 'NÍZKÁ ENERGIE',
      sub: '<30s senzorické spouštěče',
      icon: <BatteryCharging className="w-4 h-4 text-indigo-400 shrink-0" />,
      capacity: 'low',
      color: 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300',
    },
    BALANCED_FLOW: {
      label: 'ROVNOMĚRNÝ FLOW',
      sub: 'Pragmatická realizace krok za krokem',
      icon: <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />,
      capacity: 'medium',
      color: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
    },
    PEAK_PERFORMANCE: {
      label: 'MAXIMÁLNÍ VÝKON',
      sub: 'Hyperfokus na zásadní cíl',
      icon: <Zap className="w-4 h-4 text-amber-400 shrink-0" />,
      capacity: 'high',
      color: 'border-amber-500/50 bg-amber-500/15 text-amber-300',
    },
  };

  // Zero-Plan Dopamine Kickstart handler
  const handleZeroPlanKickstart = () => {
    onPlayClick();
    const kickstartSteps = [
      'Vypij 1 velkou sklenici studené vody.',
      'Otevři okno nebo vyjdi na 60 sekund na čerstvý vzduch.',
      'Napiš na papír nebo do aplikace tu nejotravnější myšlenku.',
    ];
    trackMorningLaunchpadCompleted({
      mode: 'LOW_BATTERY',
      primaryTask: 'Ranní probuzení & restart dopaminu',
      stepsCount: kickstartSteps.length,
      capacity: 'low',
    });
    onLaunchFlow({
      mode: 'LOW_BATTERY',
      capacity: 'low',
      primaryTask: 'Ranní probuzení & restart dopaminu',
      steps: kickstartSteps,
      orbitalStash: [],
      category: 'fuel',
      source: 'heuristic_fallback',
    });
  };

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = rawDump.trim();
    if (!text) return;

    onPlayClick();

    // Auto-triage raw input into Warm-Up, Needle Mover, and Maintenance
    const triaged = autoTriageRawInput(text, modeConfigs[mode].capacity);

    const primary = triaged.needleMover[0]?.title || triaged.orderedTasks[0]?.title || text;
    
    // Remaining items go into background orbital stash
    const remaining: string[] = [];
    triaged.warmUp.forEach((t) => {
      if (t.title !== primary) remaining.push(t.title);
    });
    triaged.needleMover.forEach((t) => {
      if (t.title !== primary) remaining.push(t.title);
    });
    triaged.maintenance.forEach((t) => {
      if (t.title !== primary) remaining.push(t.title);
    });

    // Extract Open Loops from dump lines
    const allLines = text.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
    const loopsToSave: Array<{ title: string; person?: string; dueDate?: string; softUrgency?: any }> = [];
    
    allLines.forEach((line) => {
      const meta = detectLoopMetadata(line);
      if (meta.person || meta.dueDate || meta.softUrgency) {
        loopsToSave.push({
          title: line,
          person: meta.person,
          dueDate: meta.dueDate,
          softUrgency: meta.softUrgency,
        });
      }
    });

    if (loopsToSave.length > 0 && onAddOpenLoops) {
      onAddOpenLoops(loopsToSave);
      setDetectedLoops(loopsToSave);
    }

    setPrimaryTask(primary);
    setWarmUpTask('');
    setOrbitalStash(remaining);
    setCompletedStepIndices([]);
    setStepView('synthesis');

    // Run Gemini LLM Decomposer on the #1 Needle Mover
    setIsDecomposing(true);
    try {
      const result = await decomposeWithAI(primary, mode);
      setDecomposed(result);
    } catch {
      // already handled in service
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSelectLoopAsPrimary = (loop: OpenLoop) => {
    onPlayClick();
    setPrimaryTask(loop.title);
    setRawDump((prev) => (prev ? `${prev}\n${loop.title}` : loop.title));
  };

  const handleAppendLoopToDump = (loop: OpenLoop) => {
    onPlayClick();
    setRawDump((prev) => (prev ? `${prev}\n${loop.title}` : loop.title));
  };

  const handleRegenerateSteps = async () => {
    if (!primaryTask.trim()) return;
    onPlayClick();
    setIsDecomposing(true);
    try {
      const result = await decomposeWithAI(primaryTask.trim(), mode);
      setDecomposed(result);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSelectPrimaryFromStash = async (index: number) => {
    onPlayClick();
    const selected = orbitalStash[index];
    const newStash = [primaryTask, ...orbitalStash.filter((_, i) => i !== index)];
    setPrimaryTask(selected);
    setOrbitalStash(newStash);
    setCompletedStepIndices([]);

    setIsDecomposing(true);
    try {
      const result = await decomposeWithAI(selected, mode);
      setDecomposed(result);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleFinalLaunch = () => {
    onPlayClick();
    const activeSteps =
      decomposed && decomposed.steps.length > 0
        ? decomposed.steps
        : [
            'Otevři potřebný program',
            'Napiš první slovo',
            'Dokonči první detail',
          ];

    const finalPrimaryTask = primaryTask.trim() || 'Hlavní cíl pro dnešek';

    // Track Launchpad activation
    trackMorningLaunchpadCompleted({
      mode,
      primaryTask: finalPrimaryTask,
      stepsCount: activeSteps.length,
      capacity: modeConfigs[mode].capacity,
    });

    onLaunchFlow({
      mode,
      capacity: modeConfigs[mode].capacity,
      primaryTask: finalPrimaryTask,
      steps: activeSteps,
      warmUpTask: warmUpTask.trim() || undefined,
      orbitalStash,
      category: decomposed?.category || 'physical',
      source: decomposed?.source || 'heuristic_fallback',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/95 backdrop-blur-xl animate-fadeIn box-border"
    >
      <div className="w-full max-w-md mx-auto min-h-[100dvh] flex flex-col justify-between p-4 box-border overflow-x-hidden relative bg-slate-900/90 border-x sm:border border-amber-500/20 sm:rounded-3xl shadow-2xl text-slate-100">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Main Content Area */}
        <div className="w-full flex-1 flex flex-col box-border">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80 w-full box-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shrink-0 shadow-md shadow-amber-500/20">
                <Compass className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-100 truncate">
                    Ranní start / Launchpad
                  </h2>
                  {currentStreak > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                      <Flame className="w-2.5 h-2.5 fill-amber-400 stroke-none" />
                      {currentStreak}d
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Fronta úkolů bez tření a rozhodování
                </p>
              </div>
            </div>

            {/* Skip / Close */}
            <button
              onClick={() => {
                onPlayClick();
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all shrink-0"
              title="Přeskočit start"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {stepView === 'input' ? (
            <form onSubmit={handleSynthesize} className="w-full flex-1 flex flex-col justify-between gap-3 box-border">
              <div className="w-full space-y-3 box-border">
                {/* ⚡ ZERO-PLAN DOPAMINE KICKSTART QUICK BUTTON */}
                <div className="p-3 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl transition-all shadow-lg shadow-amber-500/5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                        Prázdná hlava / Přehlcení?
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-950 bg-amber-400 px-1.5 py-0.2 rounded-md">
                      +10 XP
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleZeroPlanKickstart}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <Zap className="w-4 h-4 fill-current stroke-none shrink-0" />
                    <span>⚡ Dopaminový start bez plánování</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center font-medium">
                    Spustí 3krokový probouzecí cyklus (Voda → Vzduch → Výsyp hlavy) a ihned tě rozjede.
                  </p>
                </div>

                {/* Step 1: Yesterday's Open Loops (Continuity Review) */}
                {activeLoops.length > 0 && (
                  <div className="p-3 bg-slate-950/90 rounded-2xl border border-indigo-500/30 space-y-2 box-border w-full">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 truncate">
                        <Link2 className="w-3 h-3 shrink-0" />
                        <span>1. Otevřené smyčky ({activeLoops.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">Kontrola kontinuity</span>
                    </div>

                    <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-0.5 w-full box-border">
                      {activeLoops.map((loop) => (
                        <div
                          key={loop.id}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-1.5 w-full box-border"
                        >
                          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-slate-200 truncate block">
                              {loop.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                              {loop.person && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium flex items-center gap-0.5 truncate">
                                  <User className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{loop.person}</span>
                                </span>
                              )}
                              {loop.dueDate && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium flex items-center gap-0.5 shrink-0">
                                  <Calendar className="w-2.5 h-2.5 shrink-0" />
                                  <span>{formatDueDateTime(loop.dueDate)?.label || loop.dueDate}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectLoopAsPrimary(loop)}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 transition-all border border-amber-500/30"
                              title="Nastavit jako hlavní úkol dne"
                            >
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                              <span>Fokus</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAppendLoopToDump(loop)}
                              className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all"
                              title="Přidat do výsypu hlavy"
                            >
                              + Přidat
                            </button>
                            {onCompleteOpenLoop && (
                              <button
                                type="button"
                                onClick={() => {
                                  onPlayClick();
                                  onCompleteOpenLoop(loop.id);
                                }}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-all"
                                title="Označit jako hotové"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Biological Capacity State */}
                <div className="p-2.5 sm:p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 w-full box-border">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                    {activeLoops.length > 0 ? '2. Úroveň energie a kapacity' : '1. Úroveň energie a kapacity'}
                  </span>

                  <div className="flex flex-col gap-2 w-full box-border">
                    {(['LOW_BATTERY', 'BALANCED_FLOW', 'PEAK_PERFORMANCE'] as const).map((m) => {
                      const cfg = modeConfigs[m];
                      const isSelected = mode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            onPlayClick();
                            setMode(m);
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 w-full box-border ${
                            isSelected
                              ? cfg.color + ' shadow-sm'
                              : 'border-slate-800/90 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900/90'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="shrink-0 flex items-center justify-center p-1.5 rounded-lg bg-slate-950/60 border border-white/5">
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-white leading-tight">
                                {cfg.label}
                              </div>
                              <div className="text-xs text-slate-400 whitespace-normal mt-0.5 leading-snug">
                                {cfg.sub}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center justify-center">
                            {isSelected ? (
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-slate-700/80 bg-slate-950/50" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Raw Brain Dump */}
                <div className="p-2.5 sm:p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 w-full box-border">
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 truncate">
                      {activeLoops.length > 0 ? '3. Výsyp z hlavy' : '2. Výsyp z hlavy'}
                    </span>
                    <span className="text-[9px] text-slate-500 shrink-0">Odděluj čárkou nebo novým řádkem</span>
                  </div>

                  <textarea
                    value={rawDump}
                    onChange={(e) => setRawDump(e.target.value)}
                    placeholder="Napiš sem všechno, co ti leží v hlavě (např. poslat nabídku Petrovi, daně, nakoupit potraviny)..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none break-words box-border"
                  />

                  {/* Fast Templates: Compact Horizontal Chip Scroll */}
                  <div className="w-full space-y-1 pt-0.5 box-border">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">
                      Rychlé předlohy:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar no-scrollbar py-0.5 w-full box-border">
                      {presets.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onPlayClick();
                            setRawDump(p.text);
                          }}
                          className="shrink-0 text-left text-[10px] text-slate-400 hover:text-amber-300 hover:bg-slate-900 px-2 py-1 rounded-lg transition-all border border-slate-800 hover:border-amber-500/40 whitespace-nowrap"
                        >
                          ⚡ {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA (Sticky/Pinned at bottom with safe-area spacing) */}
              <div className="sticky bottom-0 pt-2 pb-2 sm:pb-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent w-full box-border z-10">
                <button
                  type="submit"
                  disabled={!rawDump.trim()}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 box-border"
                >
                  <Sparkles className="w-4 h-4 fill-current shrink-0" />
                  <span className="truncate">Sestavit frontu autopilota</span>
                </button>
              </div>
            </form>
          ) : (
            /* Synthesis & Needle Mover Review */
            <div className="w-full flex-1 flex flex-col justify-between gap-3 animate-fadeIn box-border">
              <div className="w-full space-y-4 box-border">
                {/* Detected Open Loops notification */}
                {detectedLoops.length > 0 && (
                  <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2 w-full box-border">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="break-words">
                      Zachyceno {detectedLoops.length} závazků na pozadí. Bezpečně uloženo do otevřených smyček!
                    </span>
                  </div>
                )}

                {/* The #1 Dominant Target (Focus Mode - Brutalist Dark) */}
                <div className="p-4 sm:p-5 bg-black rounded-3xl border-2 border-neutral-800 space-y-3 relative w-full box-border shadow-2xl">
                  <div className="flex items-center justify-between gap-1 w-full border-b border-neutral-900 pb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1 shrink-0">
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      #1 Aktivní úkol
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold shrink-0">+50 XP</span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight select-text break-words">
                      {primaryTask}
                    </h2>

                    {/* Discreet Swap Task Button */}
                    {orbitalStash.length > 0 && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            onPlayClick();
                            setIsSwapModalOpen(true);
                          }}
                          className="text-xs font-mono font-bold text-neutral-400 hover:text-white underline underline-offset-4 decoration-neutral-700 hover:decoration-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Vyměnit úkol ({orbitalStash.length})</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3 Interactive Micro-Steps (Gamified Clickable Buttons) */}
                  <div className="pt-3 border-t border-neutral-800/90 space-y-2.5 w-full box-border">
                    <div className="flex items-center justify-between text-xs w-full gap-1">
                      <span className="text-neutral-400 font-bold flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider truncate">
                        <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>3 fyzické mikro-kroky (&lt;10s):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleRegenerateSteps}
                        disabled={isDecomposing}
                        className="text-xs font-mono font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1.5 disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors shrink-0"
                        title="Záchranná brzda: Vygenerovat jiné kroky"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDecomposing ? 'animate-spin text-amber-400' : ''}`} />
                        <span>{isDecomposing ? 'Rozsekávám...' : 'Přegenerovat'}</span>
                      </button>
                    </div>

                    {isDecomposing ? (
                      <div className="py-6 text-center space-y-2 bg-neutral-900/60 rounded-2xl border border-neutral-800">
                        <Sparkles className="w-5 h-5 text-amber-400 mx-auto animate-bounce" />
                        <p className="text-xs text-amber-400 font-mono font-bold">
                          Rozsekávám na 3 fyzické mikro-kroky...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 w-full box-border">
                        {(decomposed?.steps || [
                          'Otevři potřebný program',
                          'Napiš první slovo',
                          'Dokonči první detail',
                        ]).map((step, idx) => {
                          const isDone = completedStepIndices.includes(idx);
                          const isCelebrating = recentCelebrationIndex === idx;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                onPlayClick();
                                const isNowDone = !isDone;
                                if (isNowDone) {
                                  setCompletedStepIndices((prev) => [...prev, idx]);
                                  setRecentCelebrationIndex(idx);
                                  setTimeout(() => setRecentCelebrationIndex(null), 1600);
                                } else {
                                  setCompletedStepIndices((prev) => prev.filter((i) => i !== idx));
                                }
                              }}
                              className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between text-left gap-3 transition-all duration-150 active:scale-[0.99] select-none box-border ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/40'
                                  : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-neutral-100'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all ${
                                    isDone
                                      ? 'bg-white border-white text-emerald-700 font-black'
                                      : 'border-neutral-600 bg-neutral-800 text-neutral-400 font-mono text-xs font-black'
                                  }`}
                                >
                                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3.5]" /> : idx + 1}
                                </div>
                                <span
                                  className={`text-sm sm:text-base font-bold leading-snug break-words ${
                                    isDone ? 'line-through opacity-90 text-white' : 'text-white'
                                  }`}
                                >
                                  {step}
                                </span>
                              </div>

                              {isDone ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider shrink-0 transition-all ${
                                    isCelebrating ? 'scale-110 ring-2 ring-white/50' : ''
                                  }`}
                                >
                                  +10 XP
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider shrink-0 px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                                  Klikni
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Launch Actions (Sticky bottom bar) */}
              <div className="sticky bottom-0 pt-3 pb-2 sm:pb-0 bg-gradient-to-t from-black via-black/95 to-transparent w-full box-border z-10 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStepView('input')}
                  className="px-4 py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono font-bold text-xs rounded-2xl transition-all shrink-0"
                >
                  Zpět
                </button>
                <button
                  type="button"
                  onClick={handleFinalLaunch}
                  className="flex-1 py-3.5 px-4 bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 box-border truncate active:scale-98"
                >
                  <span className="truncate">Spustit autopilota úkolů</span>
                  <ArrowRight className="w-4 h-4 stroke-[3] shrink-0" />
                </button>
              </div>

              {/* Modal / Dropdown: Vyměnit úkol ze zásobníku */}
              {isSwapModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-neutral-950 border-2 border-neutral-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-mono font-black uppercase text-white tracking-wider">
                          Vyměnit aktivní úkol
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSwapModalOpen(false)}
                        className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                      {orbitalStash.length === 0 ? (
                        <p className="text-xs font-mono text-neutral-400 py-3 text-center">
                          V zásobníku nejsou žádné další úkoly.
                        </p>
                      ) : (
                        orbitalStash.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleSelectPrimaryFromStash(idx);
                              setIsSwapModalOpen(false);
                            }}
                            className="w-full text-left p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
                          >
                            <span className="text-sm font-bold text-neutral-200 group-hover:text-white truncate">
                              {item}
                            </span>
                            <span className="text-xs font-mono text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                              Aktivovat <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
