import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  SkipForward,
  Split,
  Plus,
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Task, EnergyLevel } from '../types';
import { FocusTimer } from './FocusTimer';

interface Step3FocusCardProps {
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

export const Step3FocusCard: React.FC<Step3FocusCardProps> = ({
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
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [showAddSubtask, setShowAddSubtask] = useState<boolean>(false);
  const [isResistanceActive, setIsResistanceActive] = useState<boolean>(false);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [idleSeconds, setIdleSeconds] = useState<number>(0);

  // Track idle time without starting timer (ADHD friction detector)
  useEffect(() => {
    setIdleSeconds(0);
    setIsResistanceActive(false);
  }, [task?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (task && !isTimerRunning) {
      interval = setInterval(() => {
        setIdleSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setIdleSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task?.id, isTimerRunning]);

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim()) return;
    onPlayClick();
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setShowAddSubtask(false);
  };

  const handleTrigger30SecMicroStart = () => {
    onPlayClick();
    setIsResistanceActive(true);
    setIdleSeconds(0);
    if (onAwardXp) {
      onAwardXp(15, '30s startér paralýzy (+15 XP)');
    }
  };

  if (!task) {
    return (
      <section className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3.5">
          <Zap className="w-7 h-7 fill-amber-400 stroke-none" />
        </div>
        <h3 className="text-lg font-black text-slate-100 mb-1 tracking-tight">Fronta je čistá / Žádný aktivní úkol</h3>
        <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
          {totalPendingCount > 0
            ? `Žádné otevřené úkoly pro energii „${currentCapacity}“. Přepni energii výše nebo si vyber ze zásobníku úkolů!`
            : 'Zapiš úkol v rychlém zápisu nebo si vyber jídlo bez rozhodování a rozjeď se.'}
        </p>
        <button
          onClick={onSelectNewTask}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <span>Otevřít zásobník úkolů ({totalPendingCount})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    );
  }

  const completedSubtasksCount = (task?.subtasks || []).filter((s) => s?.completed).length;
  const totalSubtasksCount = (task?.subtasks || []).length;
  const xpReward = task?.xpReward || 30;
  const isHighFriction = idleSeconds >= 120; // 2 minutes stuck without starting timer

  return (
    <section className="relative bg-slate-900/95 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-xl overflow-hidden text-slate-100 transition-all flex flex-col justify-between">
      {/* Subtle background ambient glows */}
      <div className="absolute -right-20 -top-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Top Mini Header: One-Task Focus & XP Reward */}
        <div className="flex items-center justify-between mb-3.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm shadow-amber-500/30">
              ⚡
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Jeden úkol / Fokus
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              +{xpReward} XP
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
              {task.estimatedMinutes}m
            </span>
          </div>
        </div>

        {/* 1. Task Title: Large, Ultra-Readable Display Typography */}
        <div className="mb-3 relative z-10">
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug">
            {task.title}
          </h2>

          {/* Sub-instruction / Notes in muted gray text */}
          {task.notes && (
            <p className="mt-2 text-xs text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed font-medium">
              {task.notes}
            </p>
          )}
        </div>

        {/* Gentle Pulsating High Friction Banner (> 2 mins stuck) */}
        {isHighFriction && !isResistanceActive && !isTimerRunning && (
          <div className="mb-3 p-3 bg-amber-500/20 border-2 border-amber-500/60 rounded-2xl flex items-center justify-between gap-2.5 text-amber-200 text-xs animate-pulse relative z-10 shadow-lg shadow-amber-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="font-bold text-amber-300">
                Cítíš odpor nebo paralýzu? Zkus 30sekundový mikro-start.
              </p>
            </div>
            <button
              onClick={handleTrigger30SecMicroStart}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shrink-0 uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-md"
            >
              30s Start (+15 XP)
            </button>
          </div>
        )}

        {/* Active 30-sec Resistance Micro-Start Active Banner */}
        {isResistanceActive && (
          <div className="mb-3 p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-start gap-2.5 text-amber-200 text-xs animate-fadeIn relative z-10">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 fill-amber-400" />
            <div className="flex-1">
              <p className="font-bold text-amber-300 mb-0.5">30s mikro-start aktivní (+15 XP připsáno!)</p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Jen se na 30 sekund dotkni prvního kroku. Žádný tlak na dokončení.
              </p>
            </div>
          </div>
        )}

        {/* 2. Sleek Centered Focus Timer & Controls */}
        <FocusTimer
          initialMinutes={isResistanceActive ? 0.5 : task.estimatedMinutes}
          onTimerComplete={onTimerComplete}
          onPlayClick={onPlayClick}
          onTick={onTick}
          soundEnabled={soundEnabled}
          hapticEnabled={hapticEnabled}
          onRunningChange={setIsTimerRunning}
        />

        {/* 4. "UNSTUCK / RESISTANCE" Trigger Button */}
        {!isResistanceActive && !isHighFriction && (
          <div className="text-center mt-1 mb-3 relative z-10">
            <button
              onClick={handleTrigger30SecMicroStart}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-slate-950/80 border border-transparent hover:border-slate-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Cítíš odpor?{' '}
                <strong className="text-slate-300 font-semibold underline underline-offset-2">
                  Zkus 30s mikro-start (+15 XP)
                </strong>
              </span>
            </button>
          </div>
        )}

        {/* Subtasks Section (if decomposed or adding) */}
        {totalSubtasksCount > 0 && (
          <div className="my-3 space-y-2 relative z-10 bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="uppercase tracking-wider text-[10px]">2min mikro-kroky</span>
              <span className="text-emerald-400 font-mono">
                {completedSubtasksCount}/{totalSubtasksCount} hotovo
              </span>
            </div>

            <div className="space-y-1.5">
              {(task?.subtasks || []).map((sub) => (
                <button
                  key={sub?.id}
                  onClick={() => {
                    onPlayClick();
                    if (task?.id && sub?.id) onToggleSubtask(task.id, sub.id);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-855 text-left border border-slate-800/80 transition-all active:scale-98"
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      sub?.completed
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  >
                    {sub?.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      sub?.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {sub?.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Micro Step Management Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-1 pb-2 relative z-10">
          <button
            onClick={() => {
              onPlayClick();
              onDecomposeTask(task.id);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 active:scale-95 transition-all"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Rozsekat na 2min kroky</span>
          </button>

          <button
            onClick={() => {
              onPlayClick();
              setShowAddSubtask(!showAddSubtask);
            }}
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mikro-krok</span>
          </button>

          <button
            onClick={() => {
              onPlayClick();
              onSkipTask();
            }}
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all active:scale-95"
            title="Přeskočit na další úkol"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Přeskočit</span>
          </button>
        </div>

        {/* Add Subtask Form */}
        {showAddSubtask && (
          <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2 pt-1 pb-2 animate-fadeIn relative z-10">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Název mikro-kroku (např. Otevřít dokument)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl disabled:opacity-40 uppercase tracking-wider"
            >
              Přidat
            </button>
          </form>
        )}
      </div>

      {/* 3. Primary Glowing Action Button: COMPLETE TASK (+XP) */}
      <div className="pt-3 relative z-10">
        <button
          onClick={() => onCompleteTask(task.id)}
          className="w-full py-4 px-5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2.5 group"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span>HOTOVO (+{xpReward} XP)</span>
        </button>
      </div>
    </section>
  );
};
