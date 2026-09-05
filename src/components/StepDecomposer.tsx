import React, { useState, useEffect } from 'react';
import {
  X,
  Split,
  Check,
  Utensils,
  Sparkles,
  Laptop,
  Plus,
  Trash2,
  RotateCcw,
  MessageSquare,
  Sparkle,
  Bot,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { Task } from '../types';
import { decomposeWithAI, getLocalHeuristicDecomposition, DecomposeCategory } from '../services/decomposer';

interface StepDecomposerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onConfirmDecompose: (taskId: string, subtaskTitles: string[]) => void;
  onPlayClick: () => void;
}

export const StepDecomposer: React.FC<StepDecomposerProps> = ({
  isOpen,
  onClose,
  task,
  onConfirmDecompose,
  onPlayClick,
}) => {
  const [steps, setSteps] = useState<string[]>([]);
  const [category, setCategory] = useState<DecomposeCategory>('physical');
  const [source, setSource] = useState<'gemini' | 'heuristic_fallback'>('heuristic_fallback');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newStepText, setNewStepText] = useState<string>('');

  useEffect(() => {
    if (!task) return;

    // Instant local heuristic first so UI never blocks
    const localResult = getLocalHeuristicDecomposition(task.title);
    setSteps(localResult.steps);
    setCategory(localResult.category);
    setSource(localResult.source);

    // Then attempt background LLM decomposition with 2.5s strict timeout
    let isCancelled = false;
    setIsLoading(true);

    decomposeWithAI(task.title, 'desk')
      .then((aiResult) => {
        if (!isCancelled && aiResult.steps.length >= 3) {
          setSteps(aiResult.steps);
          setCategory(aiResult.category);
          setSource(aiResult.source);
        }
      })
      .catch(() => {
        // Keep heuristic
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [task?.id, isOpen]);

  if (!isOpen || !task) return null;

  const handleStepChange = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    onPlayClick();
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    onPlayClick();
    setSteps([...steps, newStepText.trim()]);
    setNewStepText('');
  };

  const handleRegenerate = async () => {
    onPlayClick();
    setIsLoading(true);
    try {
      const result = await decomposeWithAI(task.title, 'desk');
      setSteps(result.steps);
      setCategory(result.category);
      setSource(result.source);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCategory = (cat: DecomposeCategory) => {
    onPlayClick();
    setCategory(cat);
    const local = getLocalHeuristicDecomposition(task.title, cat === 'physical' ? 'field' : 'desk');
    setSteps(local.steps);
    setSource('heuristic_fallback');
  };

  const handleConfirm = () => {
    onPlayClick();
    const finalSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (finalSteps.length === 0) return;
    onConfirmDecompose(task.id, finalSteps);
    onClose();
  };

  const categoryLabels: Record<
    DecomposeCategory,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    communication: {
      label: 'Komunikace',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    chore: {
      label: 'Úklid / Fyzické',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    deep_work: {
      label: 'Hluboká práce / Soustředění',
      icon: <Laptop className="w-3.5 h-3.5" />,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    physical: {
      label: 'Fyzické / Domácnost',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    digital: {
      label: 'Digitální / Kód',
      icon: <Laptop className="w-3.5 h-3.5" />,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    admin: {
      label: 'Admin / E-maily',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    fuel: {
      label: 'Jídlo / Energie',
      icon: <Utensils className="w-3.5 h-3.5" />,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-100 my-auto space-y-4">
        {/* Close Button */}
        <button
          onClick={() => {
            onPlayClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-100">
                AI rozkladač úkolů
              </h2>
              {source === 'gemini' ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/40 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-indigo-400" />
                  Gemini AI
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-400 stroke-none" />
                  Chytrá matice
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              3 navazující fyzické mikro-kroky (&lt; 2 min) k překonání paralýzy
            </p>
          </div>
        </div>

        {/* Task Title Banner */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
            Cílový úkol
          </span>
          <p className="text-sm font-black text-slate-200">{task.title}</p>
        </div>

        {/* Context Selector Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
            Kategorie kontextu:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(Object.keys(categoryLabels) as DecomposeCategory[]).map((cat) => {
              const cfg = categoryLabels[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleApplyCategory(cat)}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? cfg.color + ' shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cfg.icon}
                  <span>{cfg.label.split('/')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navazující mikro-kroky:
            </span>
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Přegenerovat</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>Rozkládám pomocí Gemini AI...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950 border border-slate-800"
                >
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={st}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    className="flex-1 bg-transparent text-xs font-bold text-slate-200 focus:outline-none focus:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-all rounded"
                    title="Odstranit krok"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom step */}
          <form onSubmit={handleAddStep} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Přidat další mikro-krok..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!newStepText.trim()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Action CTAs */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onPlayClick();
              onClose();
            }}
            className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
          >
            Zrušit
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Použít kroky (+15 XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
