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
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Task, EnergyLevel } from '../types';
import { soundManager } from '../utils/audio';

interface OneTaskFocusProps {
  task: Task | null;
  onCompleteTask: (taskId: string) => void;
  onSkipTask: () => void;
  onDecomposeTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onPlayClick: () => void;
  onTick: () => void;
  onTimerComplete: (minutes: number) => void;
  onAwardXp?: (amount: number, reason: string) => void;
  currentCapacity: EnergyLevel;
  totalPendingCount: number;
  onSelectNewTask: () => void;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export const OneTaskFocus: React.FC<OneTaskFocusProps> = ({
  task,
  onCompleteTask,
  onSkipTask,
  onDecomposeTask,
  onAddSubtask,
  onToggleSubtask,
  onPlayClick,
  onTick,
  onTimerComplete,
  onAwardXp,
  currentCapacity,
  totalPendingCount,
  onSelectNewTask,
  soundEnabled,
  hapticEnabled,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [freezeMode, setFreezeMode] = useState<boolean>(false);
  const [freezeSeconds, setFreezeSeconds] = useState<number>(10);
  const [stepTimerSeconds, setStepTimerSeconds] = useState<number>(120); // 2 mins default
  const [isStepTimerRunning, setIsStepTimerRunning] = useState<boolean>(false);
  const [idleSeconds, setIdleSeconds] = useState<number>(0);

  // Sync active step index when task changes
  useEffect(() => {
    if (task && task.subtasks && task.subtasks.length > 0) {
      const firstIncompleteIdx = task.subtasks.findIndex((s) => !s.completed);
      setActiveStepIndex(firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0);
    } else {
      setActiveStepIndex(0);
    }
    setFreezeMode(false);
    setFreezeSeconds(10);
    setStepTimerSeconds(120);
    setIsStepTimerRunning(false);
    setIdleSeconds(0);
  }, [task?.id]);

  // Idle timer (ADHD freeze detection > 90 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (task && !isStepTimerRunning && !freezeMode) {
      interval = setInterval(() => {
        setIdleSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setIdleSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task?.id, isStepTimerRunning, freezeMode]);

  // Freeze 10-second countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (freezeMode && freezeSeconds > 0) {
      interval = setInterval(() => {
        setFreezeSeconds((prev) => {
          if (prev <= 1) {
            soundManager.playSuccess(soundEnabled);
            soundManager.triggerHaptic(hapticEnabled);
            if (onAwardXp) onAwardXp(15, '10s prolomení paralýzy hotovo (+15 XP)');
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

  // Step 2-Minute Focus Timer
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

  if (!task) {
    return (
      <section className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3.5">
          <Zap className="w-7 h-7 fill-amber-400 stroke-none" />
        </div>
        <h2 className="text-lg font-black tracking-tight text-slate-100 mb-1">
          Pracovní plocha je čistá
        </h2>
        <p className="text-xs text-slate-400 max-w-xs mb-5 font-medium">
          Žádné aktivní úkoly odpovídající tvé aktuální energii. Skvělá práce!
        </p>
        <button
          onClick={() => {
            onPlayClick();
            onSelectNewTask();
          }}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
        >
          <span>Otevřít schránku úkolů</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    );
  }

  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const currentSubtask = hasSubtasks ? subtasks[activeStepIndex] || subtasks[0] : null;
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  const handleStepDoneAndNext = () => {
    onPlayClick();
    if (!task) return;

    if (hasSubtasks && currentSubtask) {
      if (!currentSubtask.completed) {
        onToggleSubtask(task.id, currentSubtask.id);
      }
      if (onAwardXp) {
        onAwardXp(10, `Krok ${activeStepIndex + 1} hotov (+10 XP)`);
      }

      // Check if all steps complete
      const willBeAllDone =
        subtasks.every((s, i) => (i === activeStepIndex ? true : s.completed));

      if (willBeAllDone) {
        onCompleteTask(task.id);
        return;
      }

      // Advance to next incomplete step
      if (activeStepIndex < subtasks.length - 1) {
        setActiveStepIndex(activeStepIndex + 1);
        setStepTimerSeconds(120);
        setIsStepTimerRunning(false);
      }
    } else {
      onCompleteTask(task.id);
    }
  };

  const handleTriggerFreezeStart = () => {
    onPlayClick();
    setFreezeMode(true);
    setFreezeSeconds(10);
    setIsStepTimerRunning(false);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <section className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-all">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Capacity match & skip */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-amber-400 stroke-none" />
            <span>Aktivní úkol dne</span>
          </span>
          <span className="text-[11px] text-slate-500 font-bold">
            {totalPendingCount} čeká
          </span>
        </div>

        <button
          onClick={() => {
            onPlayClick();
            onSkipTask();
          }}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-all"
        >
          <span>Odložit / Další</span>
          <SkipForward className="w-3 h-3" />
        </button>
      </div>

      {/* Main Task Title */}
      <h2 className="text-base sm:text-xl font-black text-slate-100 tracking-tight leading-snug mb-3">
        {task.title}
      </h2>

      {/* Friction Alert Banner if idle > 90s */}
      {idleSeconds > 90 && !freezeMode && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Cítíš paralýzu nebo velký odpor?</span>
          </div>
          <button
            onClick={handleTriggerFreezeStart}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:brightness-110 shrink-0"
          >
            10s start
          </button>
        </div>
      )}

      {/* Step Player Interactive Carousel Card */}
      {hasSubtasks ? (
        <div className="bg-slate-950 rounded-2xl border-2 border-amber-500/40 p-4 sm:p-5 shadow-inner space-y-4 mb-4">
          {/* Step Progress & Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Krok {activeStepIndex + 1} z {subtasks.length}
              </span>
              <div className="flex items-center gap-1">
                {subtasks.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      onPlayClick();
                      setActiveStepIndex(idx);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === activeStepIndex
                        ? 'bg-amber-400 ring-2 ring-amber-400/30'
                        : st.completed
                        ? 'bg-emerald-500'
                        : 'bg-slate-800'
                    }`}
                    title={`Přejít na krok ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => {
                  onPlayClick();
                  setActiveStepIndex((prev) => Math.max(0, prev - 1));
                }}
                className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={activeStepIndex === subtasks.length - 1}
                onClick={() => {
                  onPlayClick();
                  setActiveStepIndex((prev) => Math.min(subtasks.length - 1, prev + 1));
                }}
                className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Freeze Mode 10-Second Countdown Overlay */}
          {freezeMode ? (
            <div className="py-6 px-4 bg-gradient-to-tr from-amber-500/20 to-amber-600/10 border border-amber-500/50 rounded-2xl text-center space-y-2 animate-pulse">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                🧊 Mikro-start bez tlaku
              </span>
              <div className="text-4xl font-black text-amber-400 tracking-tighter">
                0:0{freezeSeconds}
              </div>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Jen se dotkni nebo otevři první nástroj. Po 10 sekundách můžeš kdykoliv přestat.
              </p>
              <button
                onClick={() => setFreezeMode(false)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline mt-2"
              >
                Zrušit / Zpět do normálního tempa
              </button>
            </div>
          ) : (
            /* Active Step Display */
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/40">
                  {activeStepIndex + 1}
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                  {currentSubtask?.title}
                </p>
              </div>

              {/* 2-Min Micro-Timer Controls */}
              <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    ⏱ {formatTimer(stepTimerSeconds)}
                  </span>
                  <span className="text-[10px] text-slate-500">2minutové mikro-vítězství</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onPlayClick();
                      setIsStepTimerRunning(!isStepTimerRunning);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isStepTimerRunning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isStepTimerRunning ? 'Pauza' : 'Spustit 2m'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onPlayClick();
                      setStepTimerSeconds(120);
                      setIsStepTimerRunning(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200"
                    title="Resetovat 2m"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Done / Next Step CTA + Freeze Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTriggerFreezeStart}
              className="px-3 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              title="Rozsekat na 10 sekund"
            >
              <span>Cítíš zásek?</span>
            </button>

            <button
              onClick={handleStepDoneAndNext}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {activeStepIndex === subtasks.length - 1
                  ? 'Dokončit celý úkol (+35 XP)'
                  : 'Hotovo / Další krok (+10 XP)'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* No subtasks yet -> Offer AI decomposition or Direct Complete */
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Úkol zatím není rozsekaný na mikro-kroky
            </span>
            <button
              onClick={() => {
                onPlayClick();
                onDecomposeTask(task.id);
              }}
              className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Rozsekat pomocí AI</span>
            </button>
          </div>

          <button
            onClick={() => {
              onPlayClick();
              onCompleteTask(task.id);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Označit jako hotové (+{task.xpReward || 25} XP)</span>
          </button>
        </div>
      )}

      {/* Footer Utility Actions */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <button
          onClick={() => {
            onPlayClick();
            onDecomposeTask(task.id);
          }}
          className="flex items-center gap-1 text-slate-400 hover:text-amber-400 font-bold transition-all"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Znovu rozsekat pomocí AI</span>
        </button>

        <button
          onClick={() => {
            onPlayClick();
            onCompleteTask(task.id);
          }}
          className="text-slate-400 hover:text-emerald-400 font-bold transition-all"
        >
          Rovnou hotovo
        </button>
      </div>
    </section>
  );
};
