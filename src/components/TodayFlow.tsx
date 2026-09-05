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

  // If literally all tasks are completed across the entire app
  if (!activeTask && totalPendingCount === 0) {
    return (
      <div className="p-8 rounded-3xl bg-neutral-950 border-2 border-neutral-800 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            Všechny úkoly rozdrceny!
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-2 font-medium">
            Fronta je čistá. Žádný stres, žádná paralýza. Užij si dopamin nebo přidej nový cíl.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => {
              onPlayClick();
              onOpenDumpModal();
            }}
            className="py-3.5 px-6 bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Zadat nový úkol (+20 XP)</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Task Fallback
  if (!activeTask) {
    return null;
  }

  const subtasks = activeTask.subtasks || [];
  const isPatternAvoided = (activeTask.parkedCount || 0) >= 3;
  const isLimitReached = !isPro && completedTasksCountToday >= 3;

  // Derive 3 display steps
  const displaySteps =
    subtasks.length > 0
      ? subtasks.slice(0, 3)
      : [
          { id: 'def-1', title: 'Otevři potřebný program', completed: false },
          { id: 'def-2', title: 'Napiš první slovo', completed: false },
          { id: 'def-3', title: 'Dokonči první detail', completed: false },
        ];

  const allStepsCompleted =
    displaySteps.length > 0 && displaySteps.every((s) => s.completed);

  // Toggle step handler with gamification feedback
  const handleToggleStep = (step: { id: string; title: string; completed: boolean }, idx: number) => {
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
    <div className="w-full space-y-6 animate-fadeIn select-none">
      {/* Pattern avoided warning if task has been postponed 3+ times */}
      {isPatternAvoided && !isLimitReached && (
        <PatternFlagCard
          task={activeTask}
          onShrinkSteps={(taskId, newSteps) => {
            onUpdateTaskSubtasks(taskId, newSteps);
          }}
          onDropTask={onDropTask}
          onPlayClick={onPlayClick}
        />
      )}

      {/* Daily limit reached banner for freemium */}
      {isLimitReached ? (
        <section
          aria-label="Denní fokus splněn"
          className="bg-neutral-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Denní limit zdarma dosažen
            </span>
            <span className="text-xs font-black text-amber-400">3/3 úkoly</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white">
              3/3 úkolů dnes dokončeno!
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Dnešní příděl bezplatných úkolů máš v kapse. Odemkni si neomezené rozsekávání kroků a doživotní přístup bez předplatného.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onPlayClick();
                if (onOpenPaywall) onOpenPaywall();
              }}
              className="w-full py-4 px-4 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Zap className="w-4 h-4 fill-current stroke-none" />
              <span>Získat neomezený přístup (390 Kč)</span>
            </button>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <button
                onClick={() => {
                  onPlayClick();
                  if (onOpenRestoreLicense) onOpenRestoreLicense();
                }}
                className="hover:text-white transition-colors font-semibold py-1 px-1 rounded-lg"
              >
                Už máš klíč? Zadej licenci
              </button>
              <span className="text-[11px] text-neutral-500">Obnovuje se o půlnoci</span>
            </div>
          </div>
        </section>
      ) : (
        /* ========================================================================= */
        /* BRUTALIST DARK FOCUS MODE: ONLY 1 ACTIVE TASK ON SCREEN                   */
        /* ========================================================================= */
        <section
          aria-label="Aktivní úkol"
          className="bg-black border-2 border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6"
        >
          {/* Top minimal status bar */}
          <div className="flex items-center justify-between gap-3 border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-400">
                Aktivní cíl
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTask.isDeadlinePromoted && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-black uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current" />
                  Termín
                </span>
              )}

              {activeTask.person && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono font-bold flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {activeTask.person}
                </span>
              )}

              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-amber-400 text-[10px] font-mono font-black border border-neutral-800">
                +{activeTask.xpReward || 50} XP
              </span>
            </div>
          </div>

          {/* Dominate Screen: Giant Active Task Title + Discreet Swap Button */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight select-text break-words">
              {activeTask.title}
            </h1>

            {/* Discreet text button to switch task */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  setIsSwapModalOpen(true);
                }}
                className="text-xs font-mono font-bold text-neutral-400 hover:text-white underline underline-offset-4 decoration-neutral-700 hover:decoration-white transition-colors cursor-pointer inline-flex items-center gap-1.5 py-1 px-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Vyměnit úkol ({upNextTasks.length})</span>
              </button>

              {(activeTask.parkedCount || 0) > 0 && (
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  {activeTask.parkedCount}× odloženo
                </span>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE 3 MICRO-STEPS (Massive buttons + Dopamine Feedback)           */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            {/* Steps Header with Safety Brake "Přegenerovat" button */}
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                3 fyzické mikro-kroky (&lt;10s):
              </span>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={autoDecomposing}
                className="text-xs font-mono font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors disabled:opacity-40 px-2 py-1 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
                title="Záchranná brzda: Pokud kroky nesedí, vygeneruj nové"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoDecomposing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{autoDecomposing ? 'Rozsekávám...' : 'Přegenerovat'}</span>
              </button>
            </div>

            {/* 3 Massive Clickable Buttons (Checkboxes) */}
            <div className="space-y-2.5">
              {displaySteps.map((step, idx) => {
                const isDone = !!step.completed;
                const isCelebrating = recentStepCelebrationId === step.id;

                return (
                  <button
                    key={step.id || idx}
                    type="button"
                    onClick={() => handleToggleStep(step, idx)}
                    className={`w-full p-4 sm:p-5 min-h-[64px] sm:min-h-[72px] rounded-2xl border-2 flex items-center justify-between text-left gap-3.5 transition-all duration-150 active:scale-[0.99] select-none ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/40'
                        : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-neutral-100'
                    }`}
                  >
                    {/* Checkbox indicator + Step text */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${
                          isDone
                            ? 'bg-white border-white text-emerald-700 font-black'
                            : 'border-neutral-600 bg-neutral-800 text-neutral-400 font-mono text-xs font-black'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3.5]" /> : idx + 1}
                      </div>

                      <span
                        className={`text-base sm:text-lg font-bold leading-snug break-words ${
                          isDone ? 'line-through opacity-90 text-white' : 'text-white'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>

                    {/* Dopamine XP Badge */}
                    {isDone ? (
                      <span
                        className={`px-3 py-1 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                          isCelebrating ? 'scale-110 ring-4 ring-emerald-300/40' : ''
                        }`}
                      >
                        +10 XP
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider shrink-0 px-2 py-1 rounded bg-neutral-800/80 border border-neutral-750">
                        Klikni
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ACTION BUTTONS (Complete Task or Park)                                    */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-3 pt-3">
            {/* Park / Postpone Task Button */}
            <button
              type="button"
              onClick={() => {
                onPlayClick();
                onParkTask(activeTask.id);
              }}
              className="px-4 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
              title="Odložit na konec fronty"
            >
              <Archive className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>Odložit</span>
            </button>

            {/* Giant Complete Task CTA */}
            <button
              type="button"
              onClick={handleFinishEntireTask}
              className={`flex-1 py-4 px-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-w-0 active:scale-98 shadow-xl ${
                allStepsCompleted
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/20 animate-pulse'
                  : 'bg-white hover:bg-neutral-200 text-black shadow-white/10'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3] shrink-0" />
              <span className="truncate">
                Dokončit úkol (+{activeTask.xpReward || 50} XP)
              </span>
            </button>
          </div>
        </section>
      )}

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
