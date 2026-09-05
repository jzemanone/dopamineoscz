import React, { useState, useEffect } from 'react';
import {
  Check,
  RefreshCw,
  X,
  Layers,
  Archive,
  ArrowRight,
  Flame,
  User,
  Plus,
  Zap,
  Sparkles,
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
  onParkTask,
  onDropTask,
  onSelectTask,
  onUpdateTaskSubtasks,
  onToggleSubtask,
  onQuickAddTask,
  onOpenDumpModal,
  onPlayClick,
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
  const [autoDecomposing, setAutoDecomposing] = useState<boolean>(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [quickInput, setQuickInput] = useState<string>('');
  const [recentStepCelebrationId, setRecentStepCelebrationId] = useState<string | null>(null);

  // Auto-decompose task on promotion if it has no subtasks
  useEffect(() => {
    if (!activeTask) return;

    if (!activeTask.subtasks || activeTask.subtasks.length === 0) {
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
  }, [activeTask?.id]);

  // Safety brake: regenerate 3 steps with strict ADHD prompt
  const handleRegenerate = async () => {
    if (!activeTask || autoDecomposing) return;
    onPlayClick();
    setAutoDecomposing(true);
    const bioMode = normalizeBiologicalCapacity(currentCapacity);
    try {
      const res = await decomposeWithAI(activeTask.title, bioMode, true);
      if (res.steps && res.steps.length > 0) {
        onUpdateTaskSubtasks(activeTask.id, res.steps);
      }
    } catch {
      const fallback = getLocalHeuristicDecomposition(activeTask.title, bioMode);
      if (fallback.steps && fallback.steps.length > 0) {
        onUpdateTaskSubtasks(activeTask.id, fallback.steps);
      }
    } finally {
      setAutoDecomposing(false);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickInput.trim();
    if (!clean) return;
    onPlayClick();
    onQuickAddTask(clean, currentCapacity);
    setQuickInput('');
  };

  const subtasks = activeTask?.subtasks || [];
  const isPatternAvoided = (activeTask?.parkedCount || 0) >= 3;
  const isLimitReached = !isPro && completedTasksCountToday >= 3;

  // Derive 3 display steps
  const displaySteps =
    subtasks.length > 0
      ? subtasks.slice(0, 3)
      : autoDecomposing && activeTask
      ? [
          { id: 'load-1', title: `Rozsekávám "${activeTask.title.slice(0, 28)}"...`, completed: false },
          { id: 'load-2', title: 'Generuji 3 konkrétní fyzické kroky...', completed: false },
          { id: 'load-3', title: 'Příprava akce...', completed: false },
        ]
      : activeTask
      ? [
          { id: 'act-1', title: `První fyzický krok pro: ${activeTask.title.slice(0, 24)}`, completed: false },
          { id: 'act-2', title: 'Věnuj se tomu 30 sekund', completed: false },
          { id: 'act-3', title: 'Dokonči základní krok', completed: false },
        ]
      : [];

  const allStepsCompleted =
    displaySteps.length > 0 && displaySteps.every((s) => s.completed);

  // Toggle step handler with gamification feedback
  const handleToggleStep = (step: { id: string; title: string; completed: boolean }, idx: number) => {
    if (!activeTask) return;
    onPlayClick();
    const nextCompleted = !step.completed;

    if (nextCompleted) {
      soundManager.playSuccess(soundEnabled);
      soundManager.triggerHaptic(hapticEnabled);
      onAwardXp(10, `Krok ${idx + 1} hotov (+10 XP)`);
      trackStepCompleted({
        stepIndex: idx,
        totalSteps: displaySteps.length,
        taskTitle: activeTask.title,
        xpEarned: 10,
      });

      setRecentStepCelebrationId(step.id);
      setTimeout(() => setRecentStepCelebrationId(null), 1800);
    }

    if (subtasks.some((s) => s.id === step.id)) {
      onToggleSubtask(activeTask.id, step.id);
    } else {
      // If using fallback dummy steps, create actual subtasks in task
      const updatedTitles = displaySteps.map((s) => s.title);
      onUpdateTaskSubtasks(activeTask.id, updatedTitles);
    }
  };

  // Complete entire task handler
  const handleFinishEntireTask = () => {
    if (!activeTask) return;
    onPlayClick();
    soundManager.playSuccess(soundEnabled);
    soundManager.triggerHaptic(hapticEnabled);
    trackTaskCompleted({
      taskId: activeTask.id,
      taskTitle: activeTask.title,
      xpEarned: activeTask.xpReward || 50,
      energyLevel: activeTask.energyLevel,
    });
    onAwardXp(activeTask.xpReward || 50, `Úkol dokončen (+${activeTask.xpReward || 50} XP)`);
    onCompleteTask(activeTask.id);
  };

  // Quick submit to queue inside the switch modal
  const handleQuickAddInsideModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onPlayClick();
    onQuickAddTask(quickInput.trim(), currentCapacity);
    setQuickInput('');
  };

  return (
    <div className="w-full flex flex-col space-y-3 select-none">
      {/* ========================================================================= */}
      {/* BOX 1: VSTUP NA ÚKOL                                                      */}
      {/* ========================================================================= */}
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 shadow-lg">
        <form onSubmit={handleQuickSubmit} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-neutral-900 border border-neutral-800 focus-within:border-amber-400 rounded-xl px-3 py-2 transition-all">
            <Plus className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Zadej úkol k okamžitému rozsekání..."
              className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-neutral-500 focus:outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={!quickInput.trim() || autoDecomposing}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <Sparkles className={`w-3.5 h-3.5 ${autoDecomposing ? 'animate-spin' : ''}`} />
            <span>Rozsekat</span>
          </button>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* BOX 2: HLAVNÍ AKTIVNÍ ÚKOL                                                */}
      {/* ========================================================================= */}
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-lg space-y-1.5">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-900 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 truncate">
              Hlavní aktivní úkol
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTask && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-amber-400 text-[10px] font-mono font-black border border-neutral-800">
                +{activeTask.xpReward || 50} XP
              </span>
            )}
            {upNextTasks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  setIsSwapModalOpen(true);
                }}
                className="text-[10px] font-mono font-bold text-neutral-400 hover:text-white underline underline-offset-2 flex items-center gap-1 transition-colors"
              >
                <Layers className="w-3 h-3" />
                <span>Vyměnit ({upNextTasks.length})</span>
              </button>
            )}
          </div>
        </div>

        <div>
          {activeTask ? (
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight select-text break-words">
              {activeTask.title}
            </h1>
          ) : (
            <p className="text-sm font-bold text-neutral-400 py-1">
              Žádný aktivní úkol. Zadej nový cíl do pole výše.
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOX 3: KROKY (3 MIKRO-KROKY)                                              */}
      {/* ========================================================================= */}
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between text-xs border-b border-neutral-900 pb-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
            3 fyzické kroky (&lt;10s):
          </span>

          {activeTask && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={autoDecomposing}
              className="text-[11px] font-mono font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors disabled:opacity-40"
              title="Záchranná brzda: Přegenerovat kroky v češtině"
            >
              <RefreshCw className={`w-3 h-3 ${autoDecomposing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{autoDecomposing ? 'Rozsekávám...' : 'Přegenerovat'}</span>
            </button>
          )}
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {displaySteps.map((step, idx) => {
            const isDone = !!step.completed;
            const isCelebrating = recentStepCelebrationId === step.id;

            return (
              <button
                key={step.id || idx}
                type="button"
                disabled={!activeTask}
                onClick={() => handleToggleStep(step, idx)}
                className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-left gap-2.5 transition-all select-none active:scale-[0.99] ${
                  isDone
                    ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-xs font-mono font-black ${
                      isDone
                        ? 'bg-white border-white text-emerald-700'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3.5]" /> : idx + 1}
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-bold truncate ${
                      isDone ? 'line-through opacity-85 text-white' : 'text-white'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {isDone ? (
                  <span
                    className={`px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                      isCelebrating ? 'scale-110 ring-2 ring-emerald-300/40' : ''
                    }`}
                  >
                    +10 XP
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-500 uppercase shrink-0 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                    Krok {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Odložit + Dokončit */}
        {activeTask && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onPlayClick();
                onParkTask(activeTask.id);
              }}
              className="px-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
              title="Odložit na konec fronty"
            >
              <Archive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Odložit</span>
            </button>

            <button
              type="button"
              onClick={handleFinishEntireTask}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 min-w-0 active:scale-98 shadow-lg ${
                allStepsCompleted
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/20 animate-pulse'
                  : 'bg-white hover:bg-neutral-200 text-black shadow-white/10'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
              <span className="truncate">
                Dokončit úkol (+{activeTask.xpReward || 50} XP)
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VYMĚNIT ÚKOL (Zásobník na pozadí přístupný pouze na vyžádání)     */}
      {/* ========================================================================= */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border-2 border-neutral-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl animate-fadeIn">
            {/* Modal Header */}
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

            {/* Task list in queue */}
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {upNextTasks.length === 0 ? (
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-1">
                  <p className="text-xs font-mono text-neutral-400">
                    V zásobníku nejsou žádné další úkoly.
                  </p>
                </div>
              ) : (
                upNextTasks.map((task, idx) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      onPlayClick();
                      onSelectTask(task.id);
                      setIsSwapModalOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-400 group-hover:text-white text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-neutral-700">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-neutral-200 group-hover:text-white truncate">
                        {task.title}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                      Aktivovat <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Quick add new task to queue form inside modal */}
            <form onSubmit={handleQuickAddInsideModal} className="flex gap-2 pt-2 border-t border-neutral-900">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="+ Přidat jiný úkol do zásobníku..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 font-medium"
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40"
              >
                Přidat
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
