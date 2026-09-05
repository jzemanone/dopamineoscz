import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  SkipForward,
  Split,
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bot,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Compass,
  Clock,
  Layers,
  Sparkle,
  ArrowUpRight,
  CheckCircle2,
  BookmarkPlus,
  User,
  Calendar,
  AlertCircle,
  Archive,
  Lock,
  Key,
  Shield,
} from 'lucide-react';
import { Task, EnergyLevel, normalizeBiologicalCapacity } from '../types';
import { soundManager } from '../utils/audio';
import { decomposeWithAI, getLocalHeuristicDecomposition } from '../services/decomposer';
import { PatternFlagCard } from './PatternFlagCard';
import { trackStepCompleted, trackTaskCompleted } from '../lib/analytics';

interface TodayFlowProps {
  activeTask: Task | null;
  upNextTasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onSkipTask: () => void;
  onParkTask: (taskId: string) => void;
  onDropTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onDecomposeTask: (taskId: string) => void;
  onUpdateTaskSubtasks: (taskId: string, subtaskTitles: string[]) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onQuickAddTask: (title: string, energy: EnergyLevel) => void;
  onOpenDumpModal: () => void;
  onPlayClick: () => void;
  onTick: () => void;
  onTimerComplete: (minutes: number) => void;
  onAwardXp: (amount: number, reason: string) => void;
  currentCapacity: EnergyLevel;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  totalPendingCount: number;
  isPro?: boolean;
  completedTasksCountToday?: number;
  onOpenPaywall?: () => void;
  onOpenRestoreLicense?: () => void;
}

export const TodayFlow: React.FC<TodayFlowProps> = ({
  activeTask,
  upNextTasks,
  onCompleteTask,
  onSkipTask,
  onParkTask,
  onDropTask,
  onSelectTask,
  onDecomposeTask,
  onUpdateTaskSubtasks,
  onAddSubtask,
  onToggleSubtask,
  onQuickAddTask,
  onOpenDumpModal,
  onPlayClick,
  onTick,
  onTimerComplete,
  onAwardXp,
  currentCapacity,
  soundEnabled,
  hapticEnabled,
  totalPendingCount,
  isPro = false,
  completedTasksCountToday = 0,
  onOpenPaywall,
  onOpenRestoreLicense,
}) => {
  // Step carousel state
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [freezeMode, setFreezeMode] = useState<boolean>(false);
  const [freezeSeconds, setFreezeSeconds] = useState<number>(10);

  // 2-minute focus timer state
  const [stepTimerSeconds, setStepTimerSeconds] = useState<number>(120);
  const [isStepTimerRunning, setIsStepTimerRunning] = useState<boolean>(false);
  const [autoDecomposing, setAutoDecomposing] = useState<boolean>(false);
  const [quickInput, setQuickInput] = useState<string>('');

  // Auto-decompose task on promotion if it has no subtasks
  useEffect(() => {
    if (!activeTask) return;

    // Reset step index to first incomplete subtask
    if (activeTask.subtasks && activeTask.subtasks.length > 0) {
      const firstIncompleteIdx = activeTask.subtasks.findIndex((s) => !s.completed);
      setActiveStepIndex(firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0);
    } else {
      setActiveStepIndex(0);

      // Auto-trigger background decomposition
      let isCancelled = false;
      setAutoDecomposing(true);

      const bioMode = normalizeBiologicalCapacity(currentCapacity);
      decomposeWithAI(activeTask.title, bioMode)
        .then((res) => {
          if (!isCancelled && res.steps.length > 0) {
            onUpdateTaskSubtasks(activeTask.id, res.steps);
          }
        })
        .catch(() => {
          const fallback = getLocalHeuristicDecomposition(activeTask.title, bioMode);
          if (!isCancelled && fallback.steps.length > 0) {
            onUpdateTaskSubtasks(activeTask.id, fallback.steps);
          }
        })
        .finally(() => {
          if (!isCancelled) setAutoDecomposing(false);
        });

      return () => {
        isCancelled = true;
      };
    }

    setFreezeMode(false);
    setFreezeSeconds(10);
    setStepTimerSeconds(120);
    setIsStepTimerRunning(false);
  }, [activeTask?.id]);

  // 10-Second Freeze Breaker Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (freezeMode && freezeSeconds > 0) {
      interval = setInterval(() => {
        setFreezeSeconds((prev) => {
          if (prev <= 1) {
            soundManager.playSuccess(soundEnabled);
            soundManager.triggerHaptic(hapticEnabled);
            onAwardXp(15, '10s prolomení paralýzy dokončeno (+15 XP)');
            setFreezeMode(false);
            return 10;
          }
          if (soundEnabled) soundManager.playTick(soundEnabled);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [freezeMode, freezeSeconds, soundEnabled, hapticEnabled, onAwardXp]);

  // 2-Minute Step Timer Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStepTimerRunning && stepTimerSeconds > 0) {
      interval = setInterval(() => {
        setStepTimerSeconds((prev) => {
          if (prev <= 1) {
            soundManager.playSuccess(soundEnabled);
            soundManager.triggerHaptic(hapticEnabled);
            setIsStepTimerRunning(false);
            onTimerComplete(2);
            return 0;
          }
          if (prev % 10 === 0) onTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStepTimerRunning, stepTimerSeconds, soundEnabled, hapticEnabled, onTick, onTimerComplete]);

  // Quick submit to queue
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onPlayClick();
    onQuickAddTask(quickInput.trim(), currentCapacity);
    setQuickInput('');
  };

  // If literally all tasks are completed across the entire app
  if (!activeTask && totalPendingCount === 0) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              Všechny úkoly rozdrceny!
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              Tvoje fronta v Dopamine OS je čistá. Udržuj streak nebo vysyp nové myšlenky.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => {
                onPlayClick();
                onOpenDumpModal();
              }}
              className="py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Vysypat nové úkoly (+20 XP)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Task Fallback
  if (!activeTask) {
    return null;
  }

  const subtasks = activeTask.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const currentSubtask = hasSubtasks ? subtasks[activeStepIndex] || subtasks[0] : null;
  const isFinalStep = !hasSubtasks || activeStepIndex >= subtasks.length - 1;
  const isPatternAvoided = (activeTask.parkedCount || 0) >= 3;

  const timerMins = Math.floor(stepTimerSeconds / 60);
  const timerSecs = stepTimerSeconds % 60;
  const timerFormatted = `${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;

  // Step advancement handler
  const handleStepDone = () => {
    onPlayClick();
    if (hasSubtasks && currentSubtask) {
      if (!currentSubtask.completed) {
        onToggleSubtask(activeTask.id, currentSubtask.id);
        onAwardXp(10, `Krok ${activeStepIndex + 1} hotov (+10 XP)`);
        trackStepCompleted({
          stepIndex: activeStepIndex,
          totalSteps: subtasks.length,
          taskTitle: activeTask.title,
          xpEarned: 10,
        });
      }

      if (activeStepIndex < subtasks.length - 1) {
        setActiveStepIndex((prev) => prev + 1);
        setStepTimerSeconds(120);
        setIsStepTimerRunning(false);
      } else {
        // All micro-steps completed -> finish entire task
        trackTaskCompleted({
          taskId: activeTask.id,
          taskTitle: activeTask.title,
          xpEarned: activeTask.xpReward || 50,
          energyLevel: activeTask.energyLevel,
        });
        onCompleteTask(activeTask.id);
      }
    } else {
      trackTaskCompleted({
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        xpEarned: activeTask.xpReward || 50,
        energyLevel: activeTask.energyLevel,
      });
      onCompleteTask(activeTask.id);
    }
  };

  const handleStepPrev = () => {
    onPlayClick();
    if (activeStepIndex > 0) {
      setActiveStepIndex((prev) => prev - 1);
    }
  };

  const handleStepNext = () => {
    onPlayClick();
    if (activeStepIndex < subtasks.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    }
  };

  const isLimitReached = !isPro && completedTasksCountToday >= 3;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* If task has been repeatedly postponed (parkedCount >= 3), show Pattern Flag card */}
      {isPatternAvoided && !isLimitReached && (
        <PatternFlagCard
          task={activeTask}
          onShrinkSteps={(taskId, newSteps) => {
            onUpdateTaskSubtasks(taskId, newSteps);
            setActiveStepIndex(0);
            setStepTimerSeconds(60);
          }}
          onDropTask={onDropTask}
          onPlayClick={onPlayClick}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. ACTIVE FOCUS CARD OR CELEBRATORY DAILY LIMIT REACHED CARD */}
      {/* ========================================================================= */}
      {isLimitReached ? (
        <section
          aria-label="Denní fokus splněn"
          className="relative bg-gradient-to-b from-[#111622] to-[#0B0F17] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 overflow-hidden ring-1 ring-amber-500/20 space-y-4"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Denní fokus splněn
            </span>
            <span className="text-xs font-black text-amber-400">3/3 Mikro-výhry (+30 XP)</span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-100 leading-snug">
              3/3 Mikro-výhry dnes dokončeny (získáno +30 XP)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dnešní příděl fokusu máš v kapse! Odemkni si neomezené rozsekávání s AI, nepřerušené flow a doživotní synchronizaci bez předplatného.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                onPlayClick();
                if (onOpenPaywall) onOpenPaywall();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current stroke-none" />
              <span>🚀 Zrušit denní limity ($27)</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                onClick={() => {
                  onPlayClick();
                  if (onOpenRestoreLicense) onOpenRestoreLicense();
                }}
                className="hover:text-amber-300 transition-colors font-semibold py-1 px-1.5 rounded-lg hover:bg-slate-800/40"
              >
                Už máš licenci? Zadej klíč
              </button>
              <span className="text-[11px] text-slate-400 font-medium">Obnovuje se denně o půlnoci</span>
            </div>
          </div>
        </section>
      ) : (
      <section
        aria-label="Active Autopilot Task"
        className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-750/90 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-slate-950/80 overflow-hidden ring-1 ring-white/5 space-y-4"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Autopilot Status Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[11px] font-black tracking-wider uppercase text-amber-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Autopilot fokus
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {activeTask.isDeadlinePromoted && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 fill-current" />
                Termín &lt; 48h
              </span>
            )}

            {activeTask.person && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" />
                {activeTask.person}
              </span>
            )}

            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 text-[10px] font-black border border-slate-700 flex items-center gap-0.5">
              +{activeTask.xpReward || 30} XP
            </span>
          </div>
        </div>

        {/* Big Active Task Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Aktivní cíl
            </span>
            {(activeTask.parkedCount || 0) > 0 && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                {activeTask.parkedCount}× odloženo
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-100 leading-snug tracking-tight">
            {activeTask.title}
          </h2>
          {activeTask.notes && (
            <p className="text-xs text-slate-400 font-medium italic">
              {activeTask.notes}
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Micro-Step Carousel / Step Box */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/90 rounded-2xl border border-slate-800/90 p-3 sm:p-4 space-y-3 shadow-inner">
          {/* Step Meta Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider">
                Mikro-krok:
              </span>
              <span className="text-amber-400 font-black text-xs">
                {hasSubtasks
                  ? `${activeStepIndex + 1} z ${subtasks.length}${isFinalStep ? ' (Akce)' : ''}`
                  : '1 z 1'}
              </span>
              {autoDecomposing && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400/80 animate-pulse ml-1 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Gemini rozsekává...
                </span>
              )}
            </div>

            {/* Pagination Dots */}
            {hasSubtasks && subtasks.length > 1 && (
              <div className="flex items-center gap-1">
                {subtasks.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      onPlayClick();
                      setActiveStepIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeStepIndex
                        ? 'w-4 bg-amber-400'
                        : st.completed
                        ? 'w-1.5 bg-emerald-500'
                        : 'w-1.5 bg-slate-700'
                    }`}
                    title={`Krok ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Micro-Step Content Display */}
          <div className="min-h-[56px] flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            {hasSubtasks && subtasks.length > 1 && (
              <button
                onClick={handleStepPrev}
                disabled={activeStepIndex === 0}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-20 transition-all shrink-0"
                title="Předchozí krok"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex-1 text-center sm:text-left px-1">
              <p className="text-sm sm:text-base font-black text-slate-100 leading-snug">
                {currentSubtask
                  ? currentSubtask.title
                  : autoDecomposing
                  ? 'Sestavuji mikro-krok bez tření...'
                  : 'Udělej 1 jednoduchou, fyzickou akci pro start.'}
              </p>
            </div>

            {hasSubtasks && subtasks.length > 1 && (
              <button
                onClick={handleStepNext}
                disabled={activeStepIndex === subtasks.length - 1}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-20 transition-all shrink-0"
                title="Další krok"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* STEP 3 CONTEXT-AWARE EXECUTION CONTROLS (Only shown in Step 3 / Final Step if sustained momentum needed) */}
          {isFinalStep && (
            <div className="pt-1">
              {/* Check if task requires sustained momentum */}
              {activeTask.estimatedMinutes >= 5 ||
              ['deep_work', 'work', 'chore', 'physical', 'digital'].includes(activeTask.category) ||
              /\b(code|write|draft|doc|clean|wash|laundry|tidy|study|read|review|deep|build|design|organize|sheet|exercise|gym|cook|prep)\b/i.test(
                activeTask.title
              ) ? (
                <div className="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
                  {/* 2-Min Momentum Sprint Controller */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-amber-400" />
                      Sprint rozběhu
                    </span>
                    <span className="font-mono text-xs font-black text-slate-200 min-w-[34px]">
                      {timerFormatted}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onPlayClick();
                        setIsStepTimerRunning(!isStepTimerRunning);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                        isStepTimerRunning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                      }`}
                      title={isStepTimerRunning ? 'Pozastavit časovač' : 'Spustit 2min sprint rozběhu'}
                    >
                      {isStepTimerRunning ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Pauza</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Spustit 2min sprint</span>
                        </>
                      )}
                    </button>
                    {isStepTimerRunning && (
                      <button
                        type="button"
                        onClick={() => {
                          onPlayClick();
                          setStepTimerSeconds(120);
                          setIsStepTimerRunning(false);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-300 text-xs"
                        title="Resetovat 2min časovač"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Primary Step / Task Completion CTA */}
        <div className="flex items-center gap-2 pt-1">
          {/* Urgent Escape Action: Direct Task Parking (Distinct Visual Weight: Cool Blue / Slate Pill) */}
          <button
            onClick={() => {
              onPlayClick();
              onParkTask(activeTask.id);
            }}
            className="px-4 py-3.5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 text-slate-200 hover:text-sky-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm shrink-0"
            title="Něco tě vyrušilo? Odlož úkol na konec fronty"
          >
            <Archive className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-extrabold text-sky-200">Odložit</span>
          </button>

          {/* Primary Action: Giant DONE / NEXT (+10 XP) for Steps 1-2, or COMPLETE TASK for Step 3 */}
          <button
            onClick={handleStepDone}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 min-w-0"
          >
            <Check className="w-4 h-4 stroke-[3] shrink-0" />
            <span className="truncate">
              {isFinalStep
                ? `Dokončit úkol (+${activeTask.xpReward || 30} XP)`
                : `HOTOVO / DALŠÍ (+10 XP)`}
            </span>
          </button>
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* 2. UP NEXT STACK (Bottom ~40% Continuous Queue Preview) */}
      {/* ========================================================================= */}
      <section
        aria-label="Up Next Autopilot Stack"
        className="bg-slate-900/75 backdrop-blur-md border border-slate-800/80 rounded-3xl p-4 sm:p-5 space-y-3"
      >
        {/* Queue Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Další na řadě v autopilotu
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            {upNextTasks.length} ve frontě
          </span>
        </div>

        {/* Up Next List Preview */}
        {upNextTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-2">
            <p className="text-xs font-bold text-slate-400">
              Po tomto úkolu je fronta prázdná! Přidej nové myšlenky nebo pokračuj v tempu.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upNextTasks.slice(0, 3).map((task, idx) => (
              <div
                key={task.id}
                onClick={() => {
                  onPlayClick();
                  onSelectTask(task.id);
                }}
                className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition-all active:scale-99"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-700 transition-colors">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {task.title}
                    </span>
                    {task.isDeadlinePromoted && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black shrink-0">
                        Termín
                      </span>
                    )}
                    {task.person && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold shrink-0">
                        {task.person}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      task.energyLevel === 'low'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : task.energyLevel === 'medium'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {task.estimatedMinutes}m
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Add to Queue Input */}
        <form onSubmit={handleQuickAddSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="+ Rychle přidat myšlenku do fronty..."
            className="flex-1 bg-slate-950 border border-slate-800/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-2xl text-xs font-bold transition-all disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
};

