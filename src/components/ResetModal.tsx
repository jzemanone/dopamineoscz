import React, { useState, useEffect, useRef } from 'react';
import { X, Wind, LifeBuoy, Droplets, Sparkles, Move, CheckCircle2, Play, RotateCcw, Award } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { EMERGENCY_RESET_ACTIONS, EmergencyResetAction } from '../types';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardXp: (amount: number, reason: string) => void;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onPlayClick: () => void;
}

type TabType = 'quick-reset' | 'reset-menu';
type BreathPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onAwardXp,
  soundEnabled,
  hapticEnabled,
  onPlayClick,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('quick-reset');

  // Breathing State (60s session)
  const [isBreathingRunning, setIsBreathingRunning] = useState<boolean>(false);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(60);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [phaseSeconds, setPhaseSeconds] = useState<number>(4);
  const [hasCompletedBreathing, setHasCompletedBreathing] = useState<boolean>(false);

  // Emergency action completed state tracker
  const [completedActions, setCompletedActions] = useState<{ [id: string]: boolean }>({});

  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset breathing on open
  useEffect(() => {
    if (isOpen) {
      setBreathSecondsLeft(60);
      setIsBreathingRunning(false);
      setBreathPhase('inhale');
      setPhaseSeconds(4);
      setHasCompletedBreathing(false);
    } else {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    }
  }, [isOpen]);

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
            onAwardXp(10, '60sekundový restart dokončen');
            if (breathTimerRef.current) clearInterval(breathTimerRef.current);
            return 0;
          }
          return prevSec - 1;
        });

        setPhaseSeconds((prev) => {
          if (prev <= 1) {
            // Transition phase: Inhale (4s) -> Hold (4s) -> Exhale (4s) -> Hold (4s)
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

  if (!isOpen) return null;

  const handleToggleBreathing = () => {
    onPlayClick();
    if (breathSecondsLeft === 0) {
      setBreathSecondsLeft(60);
      setHasCompletedBreathing(false);
      setBreathPhase('inhale');
      setPhaseSeconds(4);
    }
    if (!isBreathingRunning) {
      soundManager.playCalmBreath('inhale', soundEnabled);
    }
    setIsBreathingRunning(!isBreathingRunning);
  };

  const handleResetBreathing = () => {
    onPlayClick();
    setIsBreathingRunning(false);
    setBreathSecondsLeft(60);
    setBreathPhase('inhale');
    setPhaseSeconds(4);
    setHasCompletedBreathing(false);
  };

  const handleCompleteEmergencyAction = (action: EmergencyResetAction) => {
    onPlayClick();
    soundManager.playSuccess(soundEnabled);
    soundManager.triggerHaptic(hapticEnabled);
    setCompletedActions((prev) => ({ ...prev, [action.id]: true }));
    onAwardXp(action.xpReward, action.title);
  };

  // Visual cues for breathing circle
  let circleScaleClass = 'scale-90';
  let phaseLabel = 'Připraven';
  let phaseInstruction = 'Stiskni Start pro spuštění 60s dechového cvičení';
  let phaseColor = 'border-slate-700 bg-slate-900';

  if (isBreathingRunning) {
    if (breathPhase === 'inhale') {
      circleScaleClass = 'scale-125 transition-transform duration-[4000ms] ease-out';
      phaseLabel = 'Hluboký nádech';
      phaseInstruction = 'Pomalu nadechuj nosem do břicha...';
      phaseColor = 'border-teal-400 bg-teal-950/40 text-teal-300 shadow-teal-500/20 shadow-2xl';
    } else if (breathPhase === 'hold-in') {
      circleScaleClass = 'scale-125';
      phaseLabel = 'Zadrž dech';
      phaseInstruction = 'Zůstaň v klidu, uvolni čelist a ramena...';
      phaseColor = 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-amber-500/20 shadow-2xl';
    } else if (breathPhase === 'exhale') {
      circleScaleClass = 'scale-85 transition-transform duration-[4000ms] ease-in';
      phaseLabel = 'Úplný výdech';
      phaseInstruction = 'Plynule vydechuj ústy a pusť napětí...';
      phaseColor = 'border-indigo-400 bg-indigo-950/40 text-indigo-300 shadow-indigo-500/20 shadow-2xl';
    } else if (breathPhase === 'hold-out') {
      circleScaleClass = 'scale-85';
      phaseLabel = 'Pauza';
      phaseInstruction = 'Vnímej klid a prázdný prostor...';
      phaseColor = 'border-slate-500 bg-slate-950 text-slate-300';
    }
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Move':
        return <Move className="w-5 h-5 text-emerald-400" />;
      default:
        return <LifeBuoy className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                SOS & Restart centrum
              </h3>
              <p className="text-[10px] text-slate-400">Prolom paralýzu a restartuj mozek</p>
            </div>
          </div>

          <button
            onClick={() => {
              onPlayClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tool Tabs */}
        <div className="grid grid-cols-2 gap-2 my-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              onPlayClick();
              setActiveTab('quick-reset');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'quick-reset'
                ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 border border-teal-500/40 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Rychlý restart (60s)</span>
          </button>

          <button
            onClick={() => {
              onPlayClick();
              setActiveTab('reset-menu');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'reset-menu'
                ? 'bg-gradient-to-r from-rose-500/20 to-rose-600/20 border border-rose-500/40 text-rose-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Nouzové menu (3)</span>
          </button>
        </div>

        {/* TAB 1: Quick Reset (60-second breathing pacer) */}
        {activeTab === 'quick-reset' && (
          <div className="flex-1 flex flex-col items-center justify-between py-2 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                Dechové zklidnění
              </span>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                60 sekund rytmického dýchání zklidní nervovou soustavu a prolomí paralýzu.
              </p>
            </div>

            {/* Breathing Animation Circle */}
            <div className="relative w-48 h-48 my-4 flex items-center justify-center">
              <div
                className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center text-center p-3 transition-all ${circleScaleClass} ${phaseColor}`}
              >
                <Wind className="w-6 h-6 mb-1 opacity-80" />
                <span className="text-sm font-black tracking-tight">{phaseLabel}</span>
                <span className="text-xs font-mono font-bold mt-0.5 opacity-90">
                  {isBreathingRunning ? `${phaseSeconds}s` : '60s'}
                </span>
              </div>
            </div>

            {/* Phase Instructions & Total Countdown */}
            <div className="w-full text-center space-y-2 mb-4">
              <p className="text-xs text-slate-300 font-medium px-4">{phaseInstruction}</p>

              {/* Progress Bar */}
              <div className="w-full max-w-xs mx-auto bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 transition-all duration-1000"
                  style={{ width: `${((60 - breathSecondsLeft) / 60) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                zbývá {breathSecondsLeft}s
              </span>
            </div>

            {/* Breathing Controls */}
            <div className="w-full flex items-center gap-2">
              <button
                onClick={handleToggleBreathing}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isBreathingRunning
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
                    : hasCompletedBreathing
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-teal-500/20'
                }`}
              >
                {isBreathingRunning ? (
                  <>
                    <span>Pozastavit</span>
                  </>
                ) : hasCompletedBreathing ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hotovo (+10 XP) • Spustit znovu</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Spustit 60s dýchání (+10 XP)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetBreathing}
                className="p-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
                title="Resetovat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Emergency Reset Menu */}
        {activeTab === 'reset-menu' && (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 py-1 custom-scrollbar">
            <div className="text-left mb-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                Přerušovače stavu paralýzy
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Vyber 1 mikroskopickou fyzickou akci níže k prolomení záseku.
              </p>
            </div>

            <div className="space-y-2.5">
              {EMERGENCY_RESET_ACTIONS.map((action) => {
                const isDone = completedActions[action.id];

                return (
                  <div
                    key={action.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {renderIcon(action.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-100 truncate">
                            {action.title}
                          </h4>
                          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-md shrink-0">
                            {action.duration}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompleteEmergencyAction(action)}
                      disabled={isDone}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isDone
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-md shadow-rose-500/10 hover:brightness-110 active:scale-98'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hotovo & získáno +{action.xpReward} XP</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5" />
                          <span>Splněno (+{action.xpReward} XP)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
