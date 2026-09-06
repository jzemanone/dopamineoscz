import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy,
  Wind,
  Droplets,
  Sparkles,
  Move,
  CheckCircle2,
  Play,
  RotateCcw,
  Award,
  Utensils,
  Zap,
  Coffee,
  Sun,
  Flame,
  Check,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { EMERGENCY_RESET_ACTIONS, EmergencyResetAction, DEFAULT_MEAL_IDEAS, MealIdea, Task, EnergyLevel } from '../types';

interface SosViewProps {
  onAwardXp: (amount: number, reason: string) => void;
  onSetCapacity: (cap: EnergyLevel) => void;
  onAddQuickTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onNavigateToToday: () => void;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onPlayClick: () => void;
}

type BreathPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export const SosView: React.FC<SosViewProps> = ({
  onAwardXp,
  onSetCapacity,
  onAddQuickTask,
  onNavigateToToday,
  soundEnabled,
  hapticEnabled,
  onPlayClick,
}) => {
  // Breathing Pacer State (60s loop)
  const [isBreathingRunning, setIsBreathingRunning] = useState<boolean>(false);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(60);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [phaseSeconds, setPhaseSeconds] = useState<number>(4);
  const [hasCompletedBreathing, setHasCompletedBreathing] = useState<boolean>(false);

  // Emergency action completed state tracker
  const [completedActions, setCompletedActions] = useState<{ [id: string]: boolean }>({});
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing pacer loop
  useEffect(() => {
    if (isBreathingRunning) {
      breathTimerRef.current = setInterval(() => {
        setBreathSecondsLeft((prevSec) => {
          if (prevSec <= 1) {
            setIsBreathingRunning(false);
            setHasCompletedBreathing(true);
            soundManager.playSuccess(soundEnabled);
            soundManager.triggerHaptic(hapticEnabled);
            onAwardXp(20, '60sekundový neuro-reset dokončen (+20 XP)');
            if (breathTimerRef.current) clearInterval(breathTimerRef.current);
            return 0;
          }
          return prevSec - 1;
        });

        setPhaseSeconds((prev) => {
          if (prev <= 1) {
            setBreathPhase((currPhase) => {
              let nextPhase: BreathPhase = 'inhale';
              if (currPhase === 'inhale') {
                nextPhase = 'hold-in';
                soundManager.playCalmBreath('hold', soundEnabled);
              } else if (currPhase === 'hold-in') {
                nextPhase = 'exhale';
                soundManager.playCalmBreath('exhale', soundEnabled);
              } else if (currPhase === 'exhale') {
                nextPhase = 'hold-out';
                soundManager.playCalmBreath('hold', soundEnabled);
              } else {
                nextPhase = 'inhale';
                soundManager.playCalmBreath('inhale', soundEnabled);
              }
              return nextPhase;
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    }

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [isBreathingRunning, soundEnabled, hapticEnabled, onAwardXp]);

  const handleToggleBreathing = () => {
    onPlayClick();
    if (!isBreathingRunning) {
      setBreathSecondsLeft(60);
      setBreathPhase('inhale');
      setPhaseSeconds(4);
      setHasCompletedBreathing(false);
      soundManager.playCalmBreath('inhale', soundEnabled);
      setIsBreathingRunning(true);
    } else {
      setIsBreathingRunning(false);
    }
  };

  const handleActionComplete = (action: EmergencyResetAction) => {
    onPlayClick();
    if (completedActions[action.id]) return;

    soundManager.playSuccess(soundEnabled);
    soundManager.triggerHaptic(hapticEnabled);
    setCompletedActions((prev) => ({ ...prev, [action.id]: true }));
    onAwardXp(action.xpReward, `Dokončeno: ${action.title} (+${action.xpReward} XP)`);
  };

  const handleSelectQuickFuel = (meal: MealIdea) => {
    onPlayClick();
    onAddQuickTask({
      title: `Doplnit energii: ${meal.name}`,
      estimatedMinutes: 2,
      energyLevel: 'low',
      category: 'health',
      xpReward: 30,
      notes: `Suroviny: ${meal.ingredients.join(', ')}`,
      subtasks: [
        { id: `s-fuel-1`, title: 'Vyskládej ingredience na linku', completed: false },
        { id: `s-fuel-2`, title: 'Sněz to / napij se pro restart dopaminu', completed: false },
      ],
    });
    onSetCapacity('low');
    onNavigateToToday();
  };

  const handleEmergencyLowBatteryReset = () => {
    onPlayClick();
    onSetCapacity('low');
    onAwardXp(15, 'Přepnuto do úsporného režimu (+15 XP)');
    onNavigateToToday();
  };

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale':
        return 'Hluboký nádech (nosem)';
      case 'hold-in':
        return 'Jemně zadrž dech';
      case 'exhale':
        return 'Pomalý výdech (ústy)';
      case 'hold-out':
        return 'Klid v neutrálu';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Primary SOS Box Breathing Pacer */}
      <section
        aria-label="ADHD Freeze Breaker Pacer"
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-rose-500/30 shadow-2xl shadow-rose-950/20 text-center space-y-4 relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-rose-400 animate-spin-slow" />
            <h2 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-tight">
              Rozbíječ ADHD paralýzy
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/40">
            Smyslový reset
          </span>
        </div>

        {/* Breathing Circle Visualization */}
        <div className="py-2 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Outer pulsating ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-1000 border-2 ${
                isBreathingRunning
                  ? breathPhase === 'inhale'
                    ? 'scale-110 bg-cyan-500/20 border-cyan-400 shadow-xl shadow-cyan-500/30'
                    : breathPhase === 'hold-in'
                    ? 'scale-110 bg-indigo-500/20 border-indigo-400'
                    : breathPhase === 'exhale'
                    ? 'scale-90 bg-emerald-500/20 border-emerald-400'
                    : 'scale-95 bg-slate-800 border-slate-700'
                  : 'border-slate-800 bg-slate-950'
              }`}
            />

            {/* Inner text */}
            <div className="relative z-10 text-center space-y-1">
              <span className="text-2xl font-black text-white font-mono">
                {isBreathingRunning ? `${phaseSeconds}s` : '60s'}
              </span>
              <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {isBreathingRunning ? getBreathInstruction() : 'Připraven'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium max-w-xs mt-3">
            {isBreathingRunning
              ? `Zbývá ${breathSecondsLeft} s • Zklidňuje přetížení prefrontálního kortexu`
              : 'Krabicový dech: 4s nádech, 4s zádrž, 4s výdech, 4s zádrž.'}
          </p>
        </div>

        {/* Single Button Action */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleToggleBreathing}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
              isBreathingRunning
                ? 'bg-slate-800 text-rose-300 border border-rose-500/40 hover:bg-slate-750'
                : 'bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 text-slate-950 shadow-rose-500/25 hover:brightness-110 active:scale-98'
            }`}
          >
            {isBreathingRunning ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Pozastavit dech</span>
              </>
            ) : (
              <>
                <Wind className="w-4 h-4 stroke-[3]" />
                <span>Spustit 60s neuro-reset (+20 XP)</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 2. Physical Sensory Resets */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Bleskové fyzické jističe
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">Výhra na 1 klik</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(EMERGENCY_RESET_ACTIONS || []).map((action) => {
            const isDone = completedActions[action?.id];
            return (
              <button
                key={action?.id}
                onClick={() => handleActionComplete(action)}
                disabled={isDone}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-200 active:scale-98'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>{action?.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {action?.duration} • +{action?.xpReward || 15} XP
                  </span>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                      +
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Zero-Decision Fuel / Quick Fuel */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Rychlé jídlo bez rozhodování (cukr v krvi)
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">&lt; 2 min příprava</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {((DEFAULT_MEAL_IDEAS || []).slice(0, 4) || []).map((meal) => (
            <div
              key={meal?.id}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-slate-200 truncate">
                  <span>{meal?.emoji}</span>
                  <span className="truncate">{meal?.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                  {(meal?.ingredients || []).slice(0, 2).join(', ')}
                </span>
              </div>

              <button
                onClick={() => handleSelectQuickFuel(meal)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-black shrink-0 transition-all"
              >
                + Přidat do fronty
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. One-Tap Re-Primer: Switch to Low Battery & Go to Today */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black text-slate-200 block">
            Zahltila tě stávající fronta úkolů?
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Přepni do úsporného režimu a řeš jen 2minutové mikro-kroky.
          </span>
        </div>
        <button
          onClick={handleEmergencyLowBatteryReset}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-black shrink-0 transition-all"
        >
          🟢 Zapnout 2minutový režim
        </button>
      </div>
    </div>
  );
};
